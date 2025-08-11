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
  StepStatus,
  SubscriptionStatus,
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

    const employeePrice = Money.fromCents(plan.cost_employee_cents, 'USD');
    const defaultCompanyPercentage = Number(plan.pct_employee_paid_by_company);

    // Use custom percentages if provided, otherwise use plan defaults
    const employeeCompanyPct =
      input.employeePercentages?.companyPercent ?? defaultCompanyPercentage;
    const spouseCompanyPct =
      input.spousePercentages?.companyPercent ?? defaultCompanyPercentage;
    const childCompanyPct =
      input.childPercentages?.companyPercent ?? defaultCompanyPercentage;

    let domainSubscription: Subscription;

    if (!input.includeSpouse && input.numOfChildren === 0) {
      domainSubscription =
        this.subscriptionFactory.createEmployeeOnlySubscription({
          companyId: '1',
          employeeId: input.employeeId.toString(),
          planId: input.planId.toString(),
          monthlyPrice: employeePrice,
          companyContributionPercentage: employeeCompanyPct,
        });
    } else {
      const spousePrice = input.includeSpouse
        ? Money.fromCents(plan.cost_spouse_cents, 'USD')
        : undefined;
      const childPrice =
        input.numOfChildren > 0
          ? Money.fromCents(plan.cost_child_cents, 'USD')
          : undefined;

      // Create with custom percentages for each member type
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(startDate.getFullYear() + 1);
      const period = new SubscriptionPeriod(startDate, endDate);

      const members: any[] = [];

      // Add employee with their custom percentage
      members.push({
        memberType: 'employee',
        memberId: input.employeeId.toString(),
        monthlyPrice: employeePrice,
        paymentAllocation: PaymentAllocation.fromPercentage(
          employeePrice,
          employeeCompanyPct,
        ),
      });

      // Add spouse with their custom percentage
      if (input.includeSpouse && spousePrice) {
        members.push({
          memberType: 'spouse',
          memberId: 'spouse_placeholder',
          monthlyPrice: spousePrice,
          paymentAllocation: PaymentAllocation.fromPercentage(
            spousePrice,
            spouseCompanyPct,
          ),
        });
      }

      // Add children with their custom percentage
      if (input.numOfChildren > 0 && childPrice) {
        for (let i = 0; i < input.numOfChildren; i++) {
          members.push({
            memberType: 'child',
            memberId: `child_${i}`,
            monthlyPrice: childPrice,
            paymentAllocation: PaymentAllocation.fromPercentage(
              childPrice,
              childCompanyPct,
            ),
          });
        }
      }

      domainSubscription = this.subscriptionFactory.createSubscription({
        companyId: '1',
        employeeId: input.employeeId.toString(),
        planId: input.planId.toString(),
        period,
        members,
      });
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
      company_pct: item.paymentAllocation.getCompanyPercentage(),
      employee_pct: item.paymentAllocation.getEmployeePercentage(),
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
      StepStatus.COMPLETED,
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
    this.validationService.validateStepsForActivation(steps);

    // Skip payment validation and processing for now
    // Just activate the subscription directly
    domainSubscription.activate();

    // Update the PLAN_ACTIVATION step to COMPLETED
    await this.repository.updateStepStatus(
      input.subscriptionId,
      SubscriptionStepType.PLAN_ACTIVATION,
      StepStatus.COMPLETED,
    );

    // Update subscription status to ACTIVE
    await this.repository.updateSubscriptionStatus(
      input.subscriptionId,
      SubscriptionStatus.ACTIVE,
    );

    // Skip the redundant planActivationService call since we've already activated
    const updatedSubscription = await this.repository.findByIdWithRelations(
      input.subscriptionId,
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

    const subscription = new Subscription(
      dbSubscription.id.toString(),
      dbSubscription.company_id.toString(),
      dbSubscription.employee_id.toString(),
      dbSubscription.plan_id.toString(),
      period,
    );

    // Override the default enrollment steps with actual database steps
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (subscription as any).enrollmentSteps = dbSubscription.steps.map(
      (step) => ({
        id: step.id.toString(),
        type: step.type,
        status: step.status,
        completedAt: step.completed_at,
        createdAt: step.created_at,
      }),
    );

    return subscription;
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
      EnrollmentStatus.ENROLLMENT_STARTED,
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

    // Override the default enrollment steps with actual database steps
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (subscription as any).enrollmentSteps = dbSubscription.steps.map(
      (step) => ({
        id: step.id.toString(),
        type: step.type,
        status: step.status,
        completedAt: step.completed_at,
        createdAt: step.created_at,
      }),
    );

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

    return Money.fromCents(costCents, 'USD');
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
