import {
  PaymentStrategy,
  PaymentResult,
} from '../strategies/payment-strategy.interface';
import { CompanyPaymentStrategy } from '../strategies/company-payment.strategy';
import { EmployeeWalletPaymentStrategy } from '../strategies/employee-wallet-payment.strategy';
import { HybridPaymentStrategy } from '../strategies/hybrid-payment.strategy';
import { PaymentAllocation } from '../value-objects/payment-allocation.value-object';
import { Money } from '../value-objects/money.value-object';

export class PaymentProcessorService {
  private strategies: PaymentStrategy[];

  constructor() {
    this.strategies = [
      new CompanyPaymentStrategy(),
      new EmployeeWalletPaymentStrategy(),
      new HybridPaymentStrategy(),
    ];
  }

  processPayment(
    allocation: PaymentAllocation,
    employeeWalletBalance: Money,
    metadata?: Record<string, any>,
  ): PaymentResult {
    const strategy = this.findStrategy(allocation);

    if (!strategy) {
      return {
        success: false,
        errorMessage: `No payment strategy available for allocation type: ${allocation.source}`,
        processedAt: new Date(),
      };
    }

    return strategy.processPayment(allocation, employeeWalletBalance, metadata);
  }

  validatePayment(
    allocation: PaymentAllocation,
    employeeWalletBalance: Money,
  ): boolean {
    const strategy = this.findStrategy(allocation);
    return strategy
      ? strategy.validatePayment(allocation, employeeWalletBalance)
      : false;
  }

  private findStrategy(
    allocation: PaymentAllocation,
  ): PaymentStrategy | undefined {
    return this.strategies.find((strategy) => strategy.canHandle(allocation));
  }
}
