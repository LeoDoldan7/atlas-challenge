import { PaymentStrategy, PaymentResult } from './payment-strategy.interface';
import {
  PaymentAllocation,
  PaymentSource,
} from '../value-objects/payment-allocation.value-object';
import { Money } from '../value-objects/money.value-object';

export class HybridPaymentStrategy implements PaymentStrategy {
  canHandle(allocation: PaymentAllocation): boolean {
    return allocation.source === PaymentSource.HYBRID;
  }

  validatePayment(
    allocation: PaymentAllocation,
    employeeWalletBalance?: Money,
  ): boolean {
    if (allocation.source !== PaymentSource.HYBRID) return false;
    if (allocation.companyContribution.amount <= 0) return false;
    if (allocation.employeeContribution.amount <= 0) return false;
    if (!employeeWalletBalance) return false;

    return allocation.canBeProcessed(employeeWalletBalance);
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
          'Hybrid payment strategy cannot handle this allocation type',
        processedAt: new Date(),
      };
    }

    if (!this.validatePayment(allocation, employeeWalletBalance)) {
      return {
        success: false,
        errorMessage:
          'Invalid hybrid payment allocation or insufficient employee funds',
        processedAt: new Date(),
      };
    }

    try {
      const transactionId = `hybrid_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      this.processCompanyPayment(allocation.companyContribution, metadata);

      this.processWalletDeduction(
        allocation.employeeContribution,
        employeeWalletBalance,
        metadata,
      );

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
            : 'Hybrid payment processing failed',
        processedAt: new Date(),
      };
    }
  }

  private processCompanyPayment(
    amount: Money,
    metadata?: Record<string, any>,
  ): void {
    if (metadata?.simulateCompanyFailure) {
      throw new Error('Company payment portion failed');
    }
  }

  private processWalletDeduction(
    amount: Money,
    walletBalance: Money,
    metadata?: Record<string, any>,
  ): void {
    if (metadata?.simulateWalletFailure) {
      throw new Error('Wallet payment portion failed');
    }

    if (!walletBalance.isGreaterThanOrEqualTo(amount)) {
      throw new Error('Insufficient wallet balance for employee portion');
    }
  }
}
