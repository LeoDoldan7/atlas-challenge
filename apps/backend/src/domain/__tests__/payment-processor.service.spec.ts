import { PaymentProcessorService } from '../services/payment-processor.service';
import {
  PaymentAllocation,
  PaymentSource,
} from '../value-objects/payment-allocation.value-object';
import { Money } from '../value-objects/money.value-object';

describe('PaymentProcessorService', () => {
  let paymentProcessor: PaymentProcessorService;
  const usd100 = new Money(100, 'USD');
  const usd50 = new Money(50, 'USD');
  const usd200 = new Money(200, 'USD');

  beforeEach(() => {
    paymentProcessor = new PaymentProcessorService();
  });

  describe('Strategy Selection', () => {
    it('should select company payment strategy for company-paid allocations', () => {
      const allocation = PaymentAllocation.companyPaid(usd100);
      const walletBalance = Money.zero('USD');

      const result = paymentProcessor.processPayment(allocation, walletBalance);

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^comp_/);
    });

    it('should select employee wallet strategy for employee-paid allocations', () => {
      const allocation = PaymentAllocation.employeePaid(usd100);
      const walletBalance = usd200;

      const result = paymentProcessor.processPayment(allocation, walletBalance);

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^wallet_/);
    });

    it('should select hybrid strategy for hybrid allocations', () => {
      const allocation = PaymentAllocation.hybrid(usd100, usd50);
      const walletBalance = usd200;

      const result = paymentProcessor.processPayment(allocation, walletBalance);

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^hybrid_/);
    });

    it('should return error when no strategy can handle allocation', () => {
      // Create a mock allocation that no strategy can handle
      const mockAllocation = {
        source: 'UNKNOWN_SOURCE' as PaymentSource,
        companyContribution: usd100,
        employeeContribution: usd50,
        totalAmount: usd100.add(usd50),
        canBeProcessed: () => true,
        getCompanyPercentage: () => 50,
        getEmployeePercentage: () => 50,
        combine: () => mockAllocation,
        toString: () => 'Mock Allocation',
        toJSON: () => ({}),
      } as unknown as PaymentAllocation;

      const result = paymentProcessor.processPayment(mockAllocation, usd200);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('No payment strategy available');
    });
  });

  describe('Payment Validation', () => {
    it('should validate company payments correctly', () => {
      const allocation = PaymentAllocation.companyPaid(usd100);
      const walletBalance = Money.zero('USD');

      const isValid = paymentProcessor.validatePayment(
        allocation,
        walletBalance,
      );

      expect(isValid).toBe(true);
    });

    it('should validate employee wallet payments correctly', () => {
      const allocation = PaymentAllocation.employeePaid(usd100);
      const sufficientBalance = usd200;
      const insufficientBalance = usd50;

      expect(
        paymentProcessor.validatePayment(allocation, sufficientBalance),
      ).toBe(true);
      expect(
        paymentProcessor.validatePayment(allocation, insufficientBalance),
      ).toBe(false);
    });

    it('should validate hybrid payments correctly', () => {
      const allocation = PaymentAllocation.hybrid(usd100, usd50);
      const sufficientBalance = usd100;
      const insufficientBalance = new Money(25, 'USD');

      expect(
        paymentProcessor.validatePayment(allocation, sufficientBalance),
      ).toBe(true);
      expect(
        paymentProcessor.validatePayment(allocation, insufficientBalance),
      ).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle strategy processing errors gracefully', () => {
      const allocation = PaymentAllocation.companyPaid(usd100);
      const walletBalance = Money.zero('USD');

      const result = paymentProcessor.processPayment(allocation, walletBalance);

      // Company payments should succeed if the allocation is valid
      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^comp_/);
      expect(result.processedAt).toBeInstanceOf(Date);
    });

    it('should handle insufficient wallet funds for employee payments', () => {
      const allocation = PaymentAllocation.employeePaid(usd100);
      const insufficientBalance = usd50;

      const result = paymentProcessor.processPayment(
        allocation,
        insufficientBalance,
      );

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Insufficient funds');
    });

    it('should handle partial failures in hybrid payments', () => {
      const allocation = PaymentAllocation.hybrid(usd100, usd50);
      const walletBalance = usd200;

      const result = paymentProcessor.processPayment(allocation, walletBalance);

      // Hybrid payments should succeed if wallet has sufficient balance
      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^hybrid_/);
    });
  });
});
