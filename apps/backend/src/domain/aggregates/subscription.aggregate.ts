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
  }: {
    memberType: ItemRole;
    memberId: string;
    monthlyPrice: Money;
    paymentAllocation: PaymentAllocation;
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
      createdAt: new Date(),
    };

    this.items.push(item);
    this.recalculateTotals();
  }

  async startEnrollment(): Promise<void> {
    if (this.items.length === 0) {
      throw new Error('Cannot start enrollment without subscription items');
    }

    const canTransition = this.stateMachine.canTransition(
      EnrollmentEvent.START_ENROLLMENT,
    );
    if (!canTransition) {
      throw new Error('Cannot start enrollment in current state');
    }

    await this.stateMachine.transition(EnrollmentEvent.START_ENROLLMENT);
    this.status = SubscriptionStatus.PENDING;
    this.updatedAt = new Date();
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

    // Check if all steps completed
    if (EnrollmentStepManager.areAllStepsCompleted(this.enrollmentSteps)) {
      // All steps completed, go through payment processing flow before activation
      if (this.stateMachine.canTransition(EnrollmentEvent.PROCESS_PAYMENT)) {
        await this.stateMachine.transition(EnrollmentEvent.PROCESS_PAYMENT);
        // Simulate immediate payment success for step-based workflow
        if (this.stateMachine.canTransition(EnrollmentEvent.PAYMENT_SUCCESS)) {
          await this.stateMachine.transition(EnrollmentEvent.PAYMENT_SUCCESS);
        }
        // Now activate
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

    // Ensure all steps are completed before activation
    this.validationService.validateAllStepsCompleted(this.enrollmentSteps);

    await this.stateMachine.transition(EnrollmentEvent.ACTIVATE);
    this.status = SubscriptionStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  async resume(): Promise<void> {
    if (!this.stateMachine.canTransition(EnrollmentEvent.RESUME)) {
      throw new Error('Cannot resume subscription in current state');
    }

    await this.stateMachine.transition(EnrollmentEvent.RESUME);
    this.status = SubscriptionStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  async cancel(): Promise<void> {
    if (!this.stateMachine.canTransition(EnrollmentEvent.CANCEL)) {
      throw new Error('Cannot cancel subscription in current state');
    }

    await this.stateMachine.transition(EnrollmentEvent.CANCEL);
    this.status = SubscriptionStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  async expire(): Promise<void> {
    if (!this.stateMachine.canTransition(EnrollmentEvent.EXPIRE)) {
      throw new Error('Cannot expire subscription in current state');
    }

    await this.stateMachine.transition(EnrollmentEvent.EXPIRE);
    this.status = SubscriptionStatus.EXPIRED;
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
