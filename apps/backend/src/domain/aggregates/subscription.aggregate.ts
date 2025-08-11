import { Money } from '../value-objects/money.value-object';
import { SubscriptionPeriod } from '../value-objects/subscription-period.value-object';
import { PaymentAllocation } from '../value-objects/payment-allocation.value-object';
import { PaymentProcessorService } from '../services/payment-processor.service';
import { PaymentResult } from '../strategies/payment-strategy.interface';
import { SubscriptionEnrollmentStateMachine } from '../state-machines/enrollment-state-machine';
import {
  EnrollmentStatus,
  EnrollmentEvent,
} from '../state-machines/enrollment-state.interface';
import { ItemRole } from '@prisma/client';

// Domain status enum - includes states not in database (DRAFT, SUSPENDED, EXPIRED)
// Values that exist in Prisma use lowercase to match database values
enum DomainSubscriptionStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'active',
  CANCELLED = 'canceled',
  TERMINATED = 'terminated',
  EXPIRED = 'EXPIRED',
}

export enum EnrollmentStepType {
  DEMOGRAPHIC_VERIFICATION = 'DEMOGRAPHIC_VERIFICATION',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  PLAN_ACTIVATION = 'PLAN_ACTIVATION',
}

interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  memberType: ItemRole;
  memberId: string;
  monthlyPrice: Money;
  paymentAllocation: PaymentAllocation;
  createdAt: Date;
}

interface EnrollmentStep {
  type: EnrollmentStepType;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  completedAt?: Date;
}

export class Subscription {
  private status: DomainSubscriptionStatus;
  private items: SubscriptionItem[] = [];
  private enrollmentSteps: EnrollmentStep[];
  private totalMonthlyAmount: Money;
  private aggregatePaymentAllocation: PaymentAllocation;
  private updatedAt: Date;
  private stateMachine: SubscriptionEnrollmentStateMachine;
  private paymentProcessor: PaymentProcessorService;
  readonly createdAt: Date = new Date();

  constructor(
    readonly id: string,
    readonly companyId: string,
    readonly employeeId: string,
    readonly planId: string,
    private period: SubscriptionPeriod,
    paymentProcessor?: PaymentProcessorService,
  ) {
    this.status = DomainSubscriptionStatus.DRAFT;
    this.enrollmentSteps = this.initializeEnrollmentSteps();
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
    this.paymentProcessor = paymentProcessor || new PaymentProcessorService();
  }

  private initializeEnrollmentSteps(): EnrollmentStep[] {
    return [
      { type: EnrollmentStepType.DEMOGRAPHIC_VERIFICATION, status: 'PENDING' },
      { type: EnrollmentStepType.DOCUMENT_UPLOAD, status: 'PENDING' },
      { type: EnrollmentStepType.PLAN_ACTIVATION, status: 'PENDING' },
    ];
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
    this.validateCanModifyItems();
    this.validateEmployeeAddedFirst(memberType);
    this.validateNoDuplicateMembers(memberId);
    this.validateChildrenLimit(memberType);

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
    this.status = DomainSubscriptionStatus.DEMOGRAPHIC_VERIFICATION_PENDING;
    this.updatedAt = new Date();
  }

  async completeEnrollmentStep(stepType: EnrollmentStepType): Promise<void> {
    this.validateCanCompleteEnrollmentStep();

    const step = this.findEnrollmentStep(stepType);
    this.validateStepNotAlreadyCompleted(step, stepType);
    this.validateStepsCompletedInOrder(stepType);

    step.status = 'COMPLETED';
    step.completedAt = new Date();

    // Progress to next enrollment status
    if (stepType === EnrollmentStepType.DEMOGRAPHIC_VERIFICATION) {
      this.status = DomainSubscriptionStatus.DOCUMENT_UPLOAD_PENDING;
    } else if (stepType === EnrollmentStepType.DOCUMENT_UPLOAD) {
      this.status = DomainSubscriptionStatus.PLAN_ACTIVATION_PENDING;
    }

    this.updatedAt = new Date();

    // Check if all steps completed
    if (this.enrollmentSteps.every((s) => s.status === 'COMPLETED')) {
      if (this.stateMachine.canTransition(EnrollmentEvent.ACTIVATE)) {
        await this.activate();
      }
    }
  }

  async processPayment(employeeWalletBalance: Money): Promise<PaymentResult> {
    if (!this.stateMachine.canTransition(EnrollmentEvent.PROCESS_PAYMENT)) {
      throw new Error('Cannot process payment in current state');
    }

    await this.stateMachine.transition(EnrollmentEvent.PROCESS_PAYMENT);

    try {
      const result = this.paymentProcessor.processPayment(
        this.aggregatePaymentAllocation,
        employeeWalletBalance,
      );

      if (result.success) {
        await this.stateMachine.transition(EnrollmentEvent.PAYMENT_SUCCESS);
      } else {
        await this.stateMachine.transition(EnrollmentEvent.PAYMENT_FAILED);
      }

      this.updatedAt = new Date();
      return result;
    } catch (error) {
      await this.stateMachine.transition(EnrollmentEvent.PAYMENT_FAILED);

      throw error;
    }
  }

  validatePayment(employeeWalletBalance: Money): boolean {
    return this.paymentProcessor.validatePayment(
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

    await this.stateMachine.transition(EnrollmentEvent.ACTIVATE);
    this.status = DomainSubscriptionStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  async resume(): Promise<void> {
    if (!this.stateMachine.canTransition(EnrollmentEvent.RESUME)) {
      throw new Error('Cannot resume subscription in current state');
    }

    await this.stateMachine.transition(EnrollmentEvent.RESUME);
    this.status = DomainSubscriptionStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  async cancel(): Promise<void> {
    if (!this.stateMachine.canTransition(EnrollmentEvent.CANCEL)) {
      throw new Error('Cannot cancel subscription in current state');
    }

    await this.stateMachine.transition(EnrollmentEvent.CANCEL);
    this.status = DomainSubscriptionStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  async expire(): Promise<void> {
    if (!this.stateMachine.canTransition(EnrollmentEvent.EXPIRE)) {
      throw new Error('Cannot expire subscription in current state');
    }

    await this.stateMachine.transition(EnrollmentEvent.EXPIRE);
    this.status = DomainSubscriptionStatus.EXPIRED;
    this.updatedAt = new Date();
  }

  private validateCanModifyItems(): void {
    if (this.status !== DomainSubscriptionStatus.DRAFT) {
      throw new Error('Cannot modify items after enrollment has started');
    }
  }

  private hasEmployeeItem(): boolean {
    return this.items.some((item) => item.memberType === ItemRole.employee);
  }

  private validateEmployeeAddedFirst(memberType: ItemRole): void {
    if (memberType !== ItemRole.employee && !this.hasEmployeeItem()) {
      throw new Error('Employee must be added before family members');
    }
  }

  private validateNoDuplicateMembers(memberId: string): void {
    if (this.items.some((item) => item.memberId === memberId)) {
      throw new Error(`Member ${memberId} already exists in subscription`);
    }
  }

  private validateChildrenLimit(memberType: ItemRole): void {
    if (memberType === ItemRole.child) {
      const childCount = this.getChildrenCount();
      if (childCount >= 10) {
        throw new Error('Maximum 10 children allowed per subscription');
      }
    }
  }

  private getChildrenCount(): number {
    return this.items.filter((i) => i.memberType === ItemRole.child).length;
  }

  private validateCanCompleteEnrollmentStep(): void {
    const enrollmentStatuses = [
      DomainSubscriptionStatus.DEMOGRAPHIC_VERIFICATION_PENDING,
      DomainSubscriptionStatus.DOCUMENT_UPLOAD_PENDING,
      DomainSubscriptionStatus.PLAN_ACTIVATION_PENDING,
    ];

    if (!enrollmentStatuses.includes(this.status)) {
      throw new Error('Cannot complete enrollment steps in current status');
    }
  }

  private findEnrollmentStep(stepType: EnrollmentStepType): EnrollmentStep {
    const step = this.enrollmentSteps.find((s) => s.type === stepType);
    if (!step) {
      throw new Error(`Enrollment step ${stepType} not found`);
    }
    return step;
  }

  private validateStepNotAlreadyCompleted(
    step: EnrollmentStep,
    stepType: EnrollmentStepType,
  ): void {
    if (step.status === 'COMPLETED') {
      throw new Error(`Step ${stepType} is already completed`);
    }
  }

  private validateStepsCompletedInOrder(stepType: EnrollmentStepType): void {
    const stepIndex = this.enrollmentSteps.findIndex(
      (s) => s.type === stepType,
    );
    if (stepIndex > 0) {
      const previousStep = this.enrollmentSteps[stepIndex - 1];
      if (previousStep.status !== 'COMPLETED') {
        throw new Error(
          `Must complete ${previousStep.type} before ${stepType}`,
        );
      }
    }
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

  getStatus(): DomainSubscriptionStatus {
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

  getPaymentProcessor(): PaymentProcessorService {
    return this.paymentProcessor;
  }

  getCurrentEnrollmentState(): EnrollmentStatus {
    return this.stateMachine.getCurrentState();
  }
}
