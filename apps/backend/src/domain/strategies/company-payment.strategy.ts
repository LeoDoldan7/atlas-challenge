import { PaymentStrategy, PaymentResult } from './payment-strategy.interface';
import {
  PaymentAllocation,
  PaymentSource,
} from '../value-objects/payment-allocation.value-object';
import { Money } from '../value-objects/money.value-object';

export class CompanyPaymentStrategy implements PaymentStrategy {
  canHandle(allocation: PaymentAllocation): boolean {
    return allocation.source === PaymentSource.COMPANY;
  }

  validatePayment(
    allocation: PaymentAllocation,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _employeeWalletBalance?: Money,
  ): boolean {
    return (
      allocation.source === PaymentSource.COMPANY &&
      allocation.employeeContribution.amount === 0
    );
  }

  processPayment(
    allocation: PaymentAllocation,
    employeeWalletBalance: Money,
    metadata?: Record<string, any>,
  ): PaymentResult {
    if (!this.canHandle(allocation)) {
      return {
        success: false,
        errorMessage:
          'Company payment strategy cannot handle this allocation type',
        processedAt: new Date(),
      };
    }

    if (!this.validatePayment(allocation, employeeWalletBalance)) {
      return {
        success: false,
        errorMessage: 'Invalid company payment allocation',
        processedAt: new Date(),
      };
    }

    try {
      const transactionId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      this.processCompanyPayment(allocation.companyContribution, metadata);

      return {
        success: true,
        transactionId,
        processedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Company payment processing failed',
        processedAt: new Date(),
      };
    }
  }

  private processCompanyPayment(
    _amount: Money,
    metadata?: Record<string, any>,
  ): void {
    if (metadata?.simulateFailure) {
      throw new Error('Simulated company payment failure');
    }
  }
}
