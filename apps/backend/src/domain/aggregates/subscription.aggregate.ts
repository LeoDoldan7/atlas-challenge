import { Money } from '../value-objects/money.value-object';
import { SubscriptionPeriod } from '../value-objects/subscription-period.value-object';
import { PaymentAllocation } from '../value-objects/payment-allocation.value-object';
import { PaymentResult } from '../strategies/payment-strategy.interface';
import { SubscriptionEnrollmentStateMachine } from '../state-machines/enrollment-state-machine';
import {
  EnrollmentStatus,
  EnrollmentEvent,
} from '../state-machines/enrollment-state.interface';
import {
  ItemRole,
  SubscriptionStatus,
  SubscriptionStepType,
} from '@prisma/client';
import { SubscriptionValidationService } from '../services/subscription-validation.service';
import {
  EnrollmentStepManager,
  EnrollmentStep,
} from '../services/enrollment-step-manager.service';
import { SubscriptionPaymentCoordinator } from '../services/subscription-payment-coordinator.service';
import { PaymentProcessorService } from '../services/payment-processor.service';

interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  memberType: ItemRole;
  memberId: string;
  monthlyPrice: Money;
  paymentAllocation: PaymentAllocation;
  customCompanyPercent?: number;
  customEmployeePercent?: number;
  createdAt: Date;
}

export class Subscription {
  private status: SubscriptionStatus;
  private items: SubscriptionItem[] = [];
  private enrollmentSteps: EnrollmentStep[];
  private totalMonthlyAmount: Money;
  private aggregatePaymentAllocation: PaymentAllocation;
  private updatedAt: Date;
  private stateMachine: SubscriptionEnrollmentStateMachine;
  private paymentCoordinator: SubscriptionPaymentCoordinator;
  private validationService: SubscriptionValidationService;
  readonly createdAt: Date = new Date();

  constructor(
    readonly id: string,
    readonly companyId: string,
    readonly employeeId: string,
    readonly planId: string,
    private period: SubscriptionPeriod,
    paymentCoordinator?: SubscriptionPaymentCoordinator,
    validationService?: SubscriptionValidationService,
  ) {
    this.status = SubscriptionStatus.DRAFT;
    this.enrollmentSteps = EnrollmentStepManager.initializeSteps();
    this.totalMonthlyAmount = Money.zero();
    this.aggregatePaymentAllocation = new PaymentAllocation({
      companyContribution: Money.zero(),
      employeeContribution: Money.zero(),
    });
    this.updatedAt = new Date();
    this.stateMachine = new SubscriptionEnrollmentStateMachine(
      id,
      EnrollmentStatus.DRAFT,
    );
    this.validationService =
      validationService || new SubscriptionValidationService();
    this.paymentCoordinator =
      paymentCoordinator ||
      new SubscriptionPaymentCoordinator(
        new PaymentProcessorService(),
        this.stateMachine,
      );
  }

  addSubscriptionItem({
    memberType,
    memberId,
    monthlyPrice,
    paymentAllocation,
    customCompanyPercent,
    customEmployeePercent,
  }: {
    memberType: ItemRole;
    memberId: string;
    monthlyPrice: Money;
    paymentAllocation: PaymentAllocation;
    customCompanyPercent?: number;
    customEmployeePercent?: number;
  }): void {
    this.validationService.validateCanModifyItems(this.status);
    this.validationService.validateEmployeeAddedFirst(memberType, this.items);
    this.validationService.validateNoDuplicateMembers(memberId, this.items);
    this.validationService.validateChildrenLimit(memberType, this.items);

    const item: SubscriptionItem = {
      id: `${this.id}_${memberType}_${memberId}`,
      subscriptionId: this.id,
      memberType,
      memberId,
      monthlyPrice,
      paymentAllocation,
      customCompanyPercent,
      customEmployeePercent,
      createdAt: new Date(),
    };

    this.items.push(item);
    this.recalculateTotals();
  }

  async completeEnrollmentStep(stepType: SubscriptionStepType): Promise<void> {
    this.validationService.validateCanCompleteEnrollmentStep(this.status);

    const step = this.validationService.validateStepExists(
      stepType,
      this.enrollmentSteps,
    );
    this.validationService.validateStepNotAlreadyCompleted(step, stepType);
    this.validationService.validateStepsCompletedInOrder(
      stepType,
      this.enrollmentSteps,
    );

    this.enrollmentSteps = EnrollmentStepManager.completeStep(
      this.enrollmentSteps,
      stepType,
    );
    this.updatedAt = new Date();

    if (EnrollmentStepManager.areAllStepsCompleted(this.enrollmentSteps)) {
      if (this.stateMachine.canTransition(EnrollmentEvent.PROCESS_PAYMENT)) {
        await this.stateMachine.transition(EnrollmentEvent.PROCESS_PAYMENT);
        if (this.stateMachine.canTransition(EnrollmentEvent.PAYMENT_SUCCESS)) {
          await this.stateMachine.transition(EnrollmentEvent.PAYMENT_SUCCESS);
        }
        if (this.stateMachine.canTransition(EnrollmentEvent.ACTIVATE)) {
          await this.activate();
        }
      }
    }
  }

  async processPayment(employeeWalletBalance: Money): Promise<PaymentResult> {
    const result = await this.paymentCoordinator.processPayment(
      this.aggregatePaymentAllocation,
      employeeWalletBalance,
    );

    this.updatedAt = new Date();
    return result;
  }

  validatePayment(employeeWalletBalance: Money): boolean {
    return this.paymentCoordinator.validatePayment(
      this.aggregatePaymentAllocation,
      employeeWalletBalance,
    );
  }

  async activate(): Promise<void> {
    if (!this.period.isActive()) {
      throw new Error(
        'Cannot activate subscription outside of subscription period',
      );
    }

    if (!this.stateMachine.canTransition(EnrollmentEvent.ACTIVATE)) {
      throw new Error('Cannot activate subscription in current state');
    }

    this.validationService.validateAllStepsCompleted(this.enrollmentSteps);

    await this.stateMachine.transition(EnrollmentEvent.ACTIVATE);
    this.status = SubscriptionStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  private recalculateTotals(): void {
    this.totalMonthlyAmount = this.items.reduce(
      (sum, item) => sum.add(item.monthlyPrice),
      Money.zero(this.items[0]?.monthlyPrice.currency || 'USD'),
    );

    this.aggregatePaymentAllocation = this.items.reduce(
      (sum, item) => sum.combine(item.paymentAllocation),
      PaymentAllocation.companyPaid(
        Money.zero(this.items[0]?.monthlyPrice.currency || 'USD'),
      ),
    );
  }

  getStatus(): SubscriptionStatus {
    return this.status;
  }

  getItems(): readonly SubscriptionItem[] {
    return [...this.items];
  }

  getEnrollmentSteps(): readonly EnrollmentStep[] {
    return [...this.enrollmentSteps];
  }

  getTotalMonthlyAmount(): Money {
    return this.totalMonthlyAmount;
  }

  getAggregatePaymentAllocation(): PaymentAllocation {
    return this.aggregatePaymentAllocation;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getPeriod(): SubscriptionPeriod {
    return this.period;
  }

  getStateMachine(): SubscriptionEnrollmentStateMachine {
    return this.stateMachine;
  }

  getPaymentCoordinator(): SubscriptionPaymentCoordinator {
    return this.paymentCoordinator;
  }

  getValidationService(): SubscriptionValidationService {
    return this.validationService;
  }

  getCurrentEnrollmentState(): EnrollmentStatus {
    return this.stateMachine.getCurrentState();
  }
}
