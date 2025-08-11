import { PaymentAllocation } from '../value-objects/payment-allocation.value-object';
import { Money } from '../value-objects/money.value-object';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
  processedAt: Date;
}

export interface PaymentStrategy {
  canHandle(allocation: PaymentAllocation): boolean;
  processPayment(
    allocation: PaymentAllocation,
    employeeWalletBalance: Money,
    metadata?: Record<string, any>,
  ): PaymentResult;
  validatePayment(
    allocation: PaymentAllocation,
    employeeWalletBalance?: Money,
  ): boolean;
}
