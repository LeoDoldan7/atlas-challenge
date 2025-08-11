import { Money } from '../value-objects/money.value-object';
import { PaymentAllocation } from '../value-objects/payment-allocation.value-object';
import { PaymentProcessorService } from './payment-processor.service';
import { PaymentResult } from '../strategies/payment-strategy.interface';
import { SubscriptionEnrollmentStateMachine } from '../state-machines/enrollment-state-machine';
import { EnrollmentEvent } from '../state-machines/enrollment-state.interface';

export class SubscriptionPaymentCoordinator {
  constructor(
    private readonly paymentProcessor: PaymentProcessorService,
    private readonly stateMachine: SubscriptionEnrollmentStateMachine,
  ) {}

  async processPayment(
    paymentAllocation: PaymentAllocation,
    employeeWalletBalance: Money,
  ): Promise<PaymentResult> {
    if (!this.stateMachine.canTransition(EnrollmentEvent.PROCESS_PAYMENT)) {
      throw new Error('Cannot process payment in current state');
    }

    await this.stateMachine.transition(EnrollmentEvent.PROCESS_PAYMENT);

    try {
      const result = this.paymentProcessor.processPayment(
        paymentAllocation,
        employeeWalletBalance,
      );

      if (result.success) {
        await this.stateMachine.transition(EnrollmentEvent.PAYMENT_SUCCESS);
      } else {
        await this.stateMachine.transition(EnrollmentEvent.PAYMENT_FAILED);
      }

      return result;
    } catch (error) {
      await this.stateMachine.transition(EnrollmentEvent.PAYMENT_FAILED);
      throw error;
    }
  }

  validatePayment(
    paymentAllocation: PaymentAllocation,
    employeeWalletBalance: Money,
  ): boolean {
    return this.paymentProcessor.validatePayment(
      paymentAllocation,
      employeeWalletBalance,
    );
  }
}
