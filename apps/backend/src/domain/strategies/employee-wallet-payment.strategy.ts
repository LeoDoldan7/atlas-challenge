import { PaymentStrategy, PaymentResult } from './payment-strategy.interface';
import {
  PaymentAllocation,
  PaymentSource,
} from '../value-objects/payment-allocation.value-object';
import { Money } from '../value-objects/money.value-object';

export class EmployeeWalletPaymentStrategy implements PaymentStrategy {
  canHandle(allocation: PaymentAllocation): boolean {
    return allocation.source === PaymentSource.EMPLOYEE_WALLET;
  }

  validatePayment(
    allocation: PaymentAllocation,
    employeeWalletBalance?: Money,
  ): boolean {
    if (allocation.source !== PaymentSource.EMPLOYEE_WALLET) return false;
    if (allocation.companyContribution.amount !== 0) return false;
    if (!employeeWalletBalance) return false;

    return allocation.canBeProcessed(employeeWalletBalance);
  }

  processPayment(
    allocation: PaymentAllocation,
    employeeWalletBalance: Money,
  ): PaymentResult {
    if (!this.canHandle(allocation)) {
      return {
        success: false,
        errorMessage:
          'Employee wallet payment strategy cannot handle this allocation type',
        processedAt: new Date(),
      };
    }

    if (!this.validatePayment(allocation, employeeWalletBalance)) {
      return {
        success: false,
        errorMessage: 'Insufficient funds in employee wallet',
        processedAt: new Date(),
      };
    }

    try {
      const transactionId = `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      this.processWalletDeduction(
        allocation.employeeContribution,
        employeeWalletBalance,
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
            : 'Wallet payment processing failed',
        processedAt: new Date(),
      };
    }
  }

  private processWalletDeduction(amount: Money, walletBalance: Money): void {
    if (!walletBalance.isGreaterThanOrEqualTo(amount)) {
      throw new Error('Insufficient wallet balance');
    }
  }
}
