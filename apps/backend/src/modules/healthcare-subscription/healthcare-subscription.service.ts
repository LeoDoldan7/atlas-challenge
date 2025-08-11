import { Injectable } from '@nestjs/common';
import { HealthcareSubscriptionRepository } from './healthcare-subscription.repository';
import { HealthcareSubscriptionMapper } from './healthcare-subscription.mapper';
import { HealthcareSubscription } from '../../graphql/healthcare-subscription/types/healthcare-subscription.type';
import { FamilyDemographicsService } from '../family-demographics/family-demographics.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { PlanActivationService } from '../plan-activation/plan-activation.service';
import { CreateSubscriptionInput } from '../../graphql/healthcare-subscription/dto/create-subscription.input';
import { UploadFamilyDemographicsInput } from '../../graphql/healthcare-subscription/dto/upload-family-demographics.input';
import { UploadFilesInput } from '../../graphql/healthcare-subscription/dto/upload-files.input';
import { ActivatePlanInput } from '../../graphql/healthcare-subscription/dto/activate-plan.input';
import {
  Prisma,
  SubscriptionStepType,
  HealthcarePlan,
  HealthcareSubscriptionItem,
} from '@prisma/client';
import { Subscription } from '../../domain/aggregates/subscription.aggregate';
import { HealthcareSubscriptionFactory } from '../../domain/factories/healthcare-subscription.factory';
import { Money } from '../../domain/value-objects/money.value-object';
import { SubscriptionPeriod } from '../../domain/value-objects/subscription-period.value-object';
import { PaymentAllocation } from '../../domain/value-objects/payment-allocation.value-object';
import { PaymentProcessorService } from '../../domain/services/payment-processor.service';
import { SubscriptionPaymentCoordinator } from '../../domain/services/subscription-payment-coordinator.service';
import { SubscriptionValidationService } from '../../domain/services/subscription-validation.service';
import { SubscriptionEnrollmentStateMachine } from '../../domain/state-machines/enrollment-state-machine';
import { EnrollmentStatus } from '../../domain/state-machines/enrollment-state.interface';

@Injectable()
export class HealthcareSubscriptionService {
  private readonly subscriptionFactory: HealthcareSubscriptionFactory;
  private readonly paymentProcessor: PaymentProcessorService;
  private readonly validationService: SubscriptionValidationService;

  constructor(
    private readonly repository: HealthcareSubscriptionRepository,
    private readonly mapper: HealthcareSubscriptionMapper,
    private readonly familyDemographicsService: FamilyDemographicsService,
    private readonly fileUploadService: FileUploadService,
    private readonly planActivationService: PlanActivationService,
  ) {
    this.subscriptionFactory = new HealthcareSubscriptionFactory();
    this.paymentProcessor = new PaymentProcessorService();
    this.validationService = new SubscriptionValidationService();
  }

  async getAllSubscriptions(): Promise<HealthcareSubscription[]> {
    const subscriptions = await this.repository.findAllWithRelations();
    return subscriptions.map((subscription) =>
      this.mapper.toGraphQL(subscription),
    );
  }

  async getSubscriptions(
    employeeId?: string,
  ): Promise<HealthcareSubscription[]> {
    const subscriptions = employeeId
      ? await this.repository.findByEmployeeId(employeeId)
      : await this.repository.findAllWithRelations();
    return subscriptions.map((subscription) =>
      this.mapper.toGraphQL(subscription),
    );
  }

  async getSubscriptionStatus(
    subscriptionId: string,
  ): Promise<HealthcareSubscription> {
    const subscription =
      await this.repository.findByIdWithRelations(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    return this.mapper.toGraphQL(subscription);
  }

  async createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<HealthcareSubscription> {
    const employee = await this.repository.findEmployeeById(
      input.employeeId.toString(),
    );
    if (!employee) {
      throw new Error('Employee not found');
    }

    const plan = await this.repository.findPlanById(input.planId.toString());
    if (!plan) {
      throw new Error('Healthcare plan not found');
    }

    const employeePrice = new Money(
      Number(plan.cost_employee_cents) / 100,
      'USD',
    );
    const companyPercentage = Number(plan.pct_employee_paid_by_company);

    let domainSubscription: Subscription;

    if (!input.includeSpouse && input.numOfChildren === 0) {
      domainSubscription =
        this.subscriptionFactory.createEmployeeOnlySubscription({
          companyId: '1',
          employeeId: input.employeeId.toString(),
          planId: input.planId.toString(),
          monthlyPrice: employeePrice,
          companyContributionPercentage: companyPercentage,
        });
    } else {
      const spousePrice = input.includeSpouse
        ? new Money(Number(plan.cost_spouse_cents) / 100, 'USD')
        : undefined;
      const childPrice =
        input.numOfChildren > 0
          ? new Money(Number(plan.cost_child_cents) / 100, 'USD')
          : undefined;

      domainSubscription = this.subscriptionFactory.createFamilySubscription(
        '1',
        input.employeeId.toString(),
        input.planId.toString(),
        {
          employeePrice,
          spousePrice,
          childPrice,
          spouseId: input.includeSpouse ? 'spouse_placeholder' : undefined,
          childrenIds: Array.from(
            { length: input.numOfChildren },
            (_, i) => `child_${i}`,
          ),
          companyContributionPercentage: companyPercentage,
        },
      );
    }

    const savedSubscription = await this.saveDomainSubscription(
      domainSubscription,
      employee.demographics_id,
    );

    return this.mapper.toGraphQL(savedSubscription);
  }

  private async saveDomainSubscription(
    domainSubscription: Subscription,
    employeeDemographicId: bigint,
  ) {
    const subscriptionData: Prisma.HealthcareSubscriptionCreateInput = {
      employee: { connect: { id: BigInt(domainSubscription.employeeId) } },
      company: { connect: { id: BigInt(domainSubscription.companyId) } },
      plan: { connect: { id: BigInt(domainSubscription.planId) } },
      billing_anchor: domainSubscription.getPeriod().getStartDate().getDate(),
      start_date: domainSubscription.getPeriod().getStartDate(),
      status: domainSubscription.getStatus(),
      type:
        domainSubscription.getItems().length === 1 ? 'individual' : 'family',
    };

    const itemsToCreate = domainSubscription.getItems().map((item, index) => ({
      role: item.memberType,
      demographic_id: index === 0 ? employeeDemographicId : undefined,
      company_pct: item.customCompanyPercent,
      employee_pct: item.customEmployeePercent,
    }));

    return await this.repository.createSubscriptionWithItems(
      subscriptionData,
      itemsToCreate,
    );
  }

  async uploadFamilyDemographics(
    input: UploadFamilyDemographicsInput,
  ): Promise<HealthcareSubscription> {
    const domainSubscription = await this.loadDomainSubscription(
      input.subscriptionId,
    );

    await domainSubscription.completeEnrollmentStep(
      SubscriptionStepType.DEMOGRAPHIC_VERIFICATION,
    );

    await this.repository.updateSubscriptionStatus(
      input.subscriptionId,
      domainSubscription.getStatus(),
    );

    await this.repository.updateStepStatus(
      input.subscriptionId,
      SubscriptionStepType.DEMOGRAPHIC_VERIFICATION,
      'COMPLETED',
    );

    const result =
      await this.familyDemographicsService.uploadFamilyDemographics(input);

    if (!result.subscription) {
      throw new Error('Family demographics upload failed');
    }

    const updatedSubscription = await this.repository.findByIdWithRelations(
      result.subscription.id.toString(),
    );
    if (!updatedSubscription) {
      throw new Error('Updated subscription not found');
    }
    return this.mapper.toGraphQL(updatedSubscription);
  }

  async uploadFiles(input: UploadFilesInput): Promise<HealthcareSubscription> {
    const domainSubscription = await this.loadDomainSubscription(
      input.subscriptionId,
    );
    await domainSubscription.completeEnrollmentStep(
      SubscriptionStepType.DOCUMENT_UPLOAD,
    );

    await this.repository.updateSubscriptionStatus(
      input.subscriptionId,
      domainSubscription.getStatus(),
    );

    const result = await this.fileUploadService.uploadFiles(input);

    if (!result.subscription) {
      throw new Error('File upload failed');
    }

    const updatedSubscription = await this.repository.findByIdWithRelations(
      result.subscription.id.toString(),
    );
    if (!updatedSubscription) {
      throw new Error('Updated subscription not found');
    }
    return this.mapper.toGraphQL(updatedSubscription);
  }

  async activatePlan(
    input: ActivatePlanInput,
  ): Promise<HealthcareSubscription> {
    const domainSubscription = await this.loadDomainSubscriptionWithItems(
      input.subscriptionId,
    );

    const steps = Array.from(domainSubscription.getEnrollmentSteps());
    this.validationService.validateAllStepsCompleted(steps);

    const employee = await this.repository.findEmployeeById(
      domainSubscription.employeeId,
    );
    if (!employee?.wallet) {
      throw new Error('Employee wallet not found');
    }

    const walletBalance = new Money(
      Number(employee.wallet.balance_cents) / 100,
      employee.wallet.currency_code,
    );
    const paymentAllocation =
      domainSubscription.getAggregatePaymentAllocation();

    const canProcessPayment = this.paymentProcessor.validatePayment(
      paymentAllocation,
      walletBalance,
    );
    if (!canProcessPayment) {
      throw new Error('Insufficient funds or invalid payment allocation');
    }

    const paymentResult =
      await domainSubscription.processPayment(walletBalance);
    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.errorMessage}`);
    }

    await domainSubscription.activate();

    await this.repository.updateSubscriptionStatus(
      input.subscriptionId,
      domainSubscription.getStatus(),
    );

    const result = await this.planActivationService.activatePlan(input);

    const updatedSubscription = await this.repository.findByIdWithRelations(
      result.subscription.id.toString(),
    );
    if (!updatedSubscription) {
      throw new Error('Updated subscription not found');
    }
    return this.mapper.toGraphQL(updatedSubscription);
  }

  private async loadDomainSubscription(
    subscriptionId: string,
  ): Promise<Subscription> {
    const dbSubscription =
      await this.repository.findByIdWithRelations(subscriptionId);
    if (!dbSubscription) {
      throw new Error('Subscription not found');
    }

    const period = new SubscriptionPeriod(
      dbSubscription.start_date,
      dbSubscription.end_date ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    );

    return new Subscription(
      dbSubscription.id.toString(),
      dbSubscription.company_id.toString(),
      dbSubscription.employee_id.toString(),
      dbSubscription.plan_id.toString(),
      period,
    );
  }

  private async loadDomainSubscriptionWithItems(
    subscriptionId: string,
  ): Promise<Subscription> {
    const dbSubscription =
      await this.repository.findByIdWithRelations(subscriptionId);
    if (!dbSubscription) {
      throw new Error('Subscription not found');
    }

    const period = new SubscriptionPeriod(
      dbSubscription.start_date,
      dbSubscription.end_date ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    );

    const stateMachine = new SubscriptionEnrollmentStateMachine(
      dbSubscription.id.toString(),
      EnrollmentStatus.DRAFT,
    );

    const paymentCoordinator = new SubscriptionPaymentCoordinator(
      this.paymentProcessor,
      stateMachine,
    );

    const subscription = new Subscription(
      dbSubscription.id.toString(),
      dbSubscription.company_id.toString(),
      dbSubscription.employee_id.toString(),
      dbSubscription.plan_id.toString(),
      period,
      paymentCoordinator,
      this.validationService,
    );

    for (const item of dbSubscription.items) {
      const price = this.calculateItemPrice(item, dbSubscription.plan);
      const allocation = this.calculatePaymentAllocation(
        item,
        price,
        dbSubscription.plan,
      );

      subscription.addSubscriptionItem({
        memberType: item.role,
        memberId: item.demographic_id?.toString() || `${item.role}_${item.id}`,
        monthlyPrice: price,
        paymentAllocation: allocation,
        customCompanyPercent: item.company_pct || undefined,
        customEmployeePercent: item.employee_pct || undefined,
      });
    }

    return subscription;
  }

  private calculateItemPrice(
    item: HealthcareSubscriptionItem,
    plan: HealthcarePlan,
  ): Money {
    const costCents =
      item.role === 'employee'
        ? plan.cost_employee_cents
        : item.role === 'spouse'
          ? plan.cost_spouse_cents
          : plan.cost_child_cents;

    return new Money(Number(costCents) / 100, 'USD');
  }

  private calculatePaymentAllocation(
    item: HealthcareSubscriptionItem,
    price: Money,
    plan: HealthcarePlan,
  ): PaymentAllocation {
    const defaultPercentage =
      item.role === 'employee'
        ? Number(plan.pct_employee_paid_by_company)
        : item.role === 'spouse'
          ? Number(plan.pct_spouse_paid_by_company)
          : Number(plan.pct_child_paid_by_company);

    const companyPercentage = Number(item.company_pct) || defaultPercentage;

    return PaymentAllocation.fromPercentage(price, companyPercentage);
  }
}
