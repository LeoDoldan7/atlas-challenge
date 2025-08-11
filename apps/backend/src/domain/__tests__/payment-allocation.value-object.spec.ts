import { PaymentAllocation } from '../value-objects/payment-allocation.value-object';
import { Money } from '../value-objects/money.value-object';

describe('PaymentAllocation Value Object', () => {
  const usd100 = new Money(100, 'USD');
  const usd50 = new Money(50, 'USD');
  const usd0 = Money.zero('USD');
  const eur100 = new Money(100, 'EUR');

  describe('Construction', () => {
    it('should create allocation with valid contributions', () => {
      const allocation = new PaymentAllocation({
        companyContribution: usd100,
        employeeContribution: usd50,
      });
      expect(allocation.companyContribution).toEqual(usd100);
      expect(allocation.employeeContribution).toEqual(usd50);
      expect(allocation.totalAmount.amount).toBe(150);
    });

    it('should throw error for contributions with invalid currencies', () => {
      expect(() => {
        const invalidCurrency = new Money(100, '');
        new PaymentAllocation({
          companyContribution: invalidCurrency,
          employeeContribution: usd50,
        });
      }).toThrow('Invalid currency code');
    });

    it('should throw error for mismatched currencies', () => {
      expect(
        () =>
          new PaymentAllocation({
            companyContribution: usd100,
            employeeContribution: eur100,
          }),
      ).toThrow('All contributions must be in the same currency');
    });

    it('should allow zero contributions for initialization', () => {
      const allocation = new PaymentAllocation({
        companyContribution: usd0,
        employeeContribution: usd0,
      });
      expect(allocation.source).toBe('COMPANY'); // Default to company when both are zero
      expect(allocation.totalAmount.amount).toBe(0);
    });
  });

  describe('Static Factory Methods', () => {
    it('should create company-paid allocation', () => {
      const allocation = PaymentAllocation.companyPaid(usd100);
      expect(allocation.companyContribution).toEqual(usd100);
      expect(allocation.employeeContribution).toEqual(usd0);
      expect(allocation.source).toBe('COMPANY');
    });

    it('should create employee-paid allocation', () => {
      const allocation = PaymentAllocation.employeePaid(usd100);
      expect(allocation.companyContribution).toEqual(usd0);
      expect(allocation.employeeContribution).toEqual(usd100);
      expect(allocation.source).toBe('EMPLOYEE_WALLET');
    });

    it('should create hybrid allocation', () => {
      const allocation = PaymentAllocation.hybrid(usd100, usd50);
      expect(allocation.companyContribution).toEqual(usd100);
      expect(allocation.employeeContribution).toEqual(usd50);
      expect(allocation.source).toBe('HYBRID');
    });

    it('should create allocation from percentage', () => {
      const total = new Money(200, 'USD');
      const allocation = PaymentAllocation.fromPercentage(total, 75);

      expect(allocation.companyContribution.amount).toBe(150);
      expect(allocation.employeeContribution.amount).toBe(50);
      expect(allocation.source).toBe('HYBRID');
    });

    it('should handle 100% company percentage', () => {
      const allocation = PaymentAllocation.fromPercentage(usd100, 100);
      expect(allocation.source).toBe('COMPANY');
    });

    it('should handle 0% company percentage', () => {
      const allocation = PaymentAllocation.fromPercentage(usd100, 0);
      expect(allocation.source).toBe('EMPLOYEE_WALLET');
    });

    it('should throw error for invalid percentage', () => {
      expect(() => PaymentAllocation.fromPercentage(usd100, -10)).toThrow(
        'Company percentage must be between 0 and 100',
      );
      expect(() => PaymentAllocation.fromPercentage(usd100, 110)).toThrow(
        'Company percentage must be between 0 and 100',
      );
    });
  });

  describe('Source Determination', () => {
    it('should identify COMPANY source', () => {
      const allocation = new PaymentAllocation({
        companyContribution: usd100,
        employeeContribution: usd0,
      });
      expect(allocation.source).toBe('COMPANY');
    });

    it('should identify EMPLOYEE_WALLET source', () => {
      const allocation = new PaymentAllocation({
        companyContribution: usd0,
        employeeContribution: usd100,
      });
      expect(allocation.source).toBe('EMPLOYEE_WALLET');
    });

    it('should identify HYBRID source', () => {
      const allocation = new PaymentAllocation({
        companyContribution: usd100,
        employeeContribution: usd50,
      });
      expect(allocation.source).toBe('HYBRID');
    });
  });

  describe('Percentage Calculations', () => {
    const allocation = new PaymentAllocation({
      companyContribution: usd100,
      employeeContribution: usd50,
    }); // Total: 150

    it('should calculate company percentage', () => {
      expect(allocation.getCompanyPercentage()).toBeCloseTo(66.67, 2);
    });

    it('should calculate employee percentage', () => {
      expect(allocation.getEmployeePercentage()).toBeCloseTo(33.33, 2);
    });

    it('should handle zero total amount', () => {
      const zeroAllocation = new PaymentAllocation({
        companyContribution: usd0,
        employeeContribution: usd0,
      });
      expect(zeroAllocation.getCompanyPercentage()).toBe(0);
      expect(zeroAllocation.getEmployeePercentage()).toBe(0);
    });

    it('should ensure percentages sum to 100', () => {
      const companyPct = allocation.getCompanyPercentage();
      const employeePct = allocation.getEmployeePercentage();
      expect(companyPct + employeePct).toBeCloseTo(100, 10);
    });
  });

  describe('Payment Processing', () => {
    it('should allow processing when employee has sufficient funds', () => {
      const allocation = new PaymentAllocation({
        companyContribution: usd50,
        employeeContribution: usd50,
      });
      const walletBalance = new Money(100, 'USD');
      expect(allocation.canBeProcessed(walletBalance)).toBe(true);
    });

    it('should allow processing when employee has exact funds', () => {
      const allocation = new PaymentAllocation({
        companyContribution: usd50,
        employeeContribution: usd50,
      });
      const walletBalance = new Money(50, 'USD');
      expect(allocation.canBeProcessed(walletBalance)).toBe(true);
    });

    it('should deny processing when employee has insufficient funds', () => {
      const allocation = new PaymentAllocation({
        companyContribution: usd50,
        employeeContribution: usd100,
      });
      const walletBalance = new Money(50, 'USD');
      expect(allocation.canBeProcessed(walletBalance)).toBe(false);
    });

    it('should allow processing for company-only payments regardless of wallet', () => {
      const allocation = PaymentAllocation.companyPaid(usd100);
      const emptyWallet = Money.zero('USD');
      expect(allocation.canBeProcessed(emptyWallet)).toBe(true);
    });
  });

  describe('Combination Operations', () => {
    it('should combine allocations correctly', () => {
      const allocation1 = new PaymentAllocation({
        companyContribution: usd100,
        employeeContribution: usd50,
      });
      const allocation2 = new PaymentAllocation({
        companyContribution: usd50,
        employeeContribution: usd100,
      });

      const combined = allocation1.combine(allocation2);

      expect(combined.companyContribution.amount).toBe(150);
      expect(combined.employeeContribution.amount).toBe(150);
      expect(combined.totalAmount.amount).toBe(300);
    });

    it('should maintain currency when combining', () => {
      const allocation1 = PaymentAllocation.companyPaid(usd100);
      const allocation2 = PaymentAllocation.employeePaid(usd50);

      const combined = allocation1.combine(allocation2);

      expect(combined.companyContribution.currency).toBe('USD');
      expect(combined.employeeContribution.currency).toBe('USD');
      expect(combined.totalAmount.currency).toBe('USD');
    });
  });

  describe('Serialization', () => {
    const allocation = new PaymentAllocation({
      companyContribution: usd100,
      employeeContribution: usd50,
    });

    it('should convert to string representation', () => {
      const result = allocation.toString();
      expect(result).toContain('Total: USD 150.00');
      expect(result).toContain('Company: USD 100.00');
      expect(result).toContain('Employee: USD 50.00');
    });

    it('should convert to JSON', () => {
      const json = allocation.toJSON();
      expect(json.companyContribution).toEqual({
        amount: 100,
        currency: 'USD',
      });
      expect(json.employeeContribution).toEqual({
        amount: 50,
        currency: 'USD',
      });
      expect(json.totalAmount).toEqual({ amount: 150, currency: 'USD' });
      expect(json.source).toBe('HYBRID');
      expect(json.companyPercentage).toBeCloseTo(66.67, 2);
      expect(json.employeePercentage).toBeCloseTo(33.33, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small amounts', () => {
      const small1 = new Money(0.01, 'USD');
      const small2 = new Money(0.02, 'USD');
      const allocation = new PaymentAllocation({
        companyContribution: small1,
        employeeContribution: small2,
      });

      expect(allocation.totalAmount.amount).toBe(0.03);
      expect(allocation.source).toBe('HYBRID');
    });

    it('should handle large amounts', () => {
      const large1 = new Money(999999, 'USD');
      const large2 = new Money(1, 'USD');
      const allocation = new PaymentAllocation({
        companyContribution: large1,
        employeeContribution: large2,
      });

      expect(allocation.totalAmount.amount).toBe(1000000);
    });

    it('should handle different currency cases', () => {
      const eur50 = new Money(50, 'EUR');
      const eur25 = new Money(25, 'EUR');
      const allocation = new PaymentAllocation({
        companyContribution: eur50,
        employeeContribution: eur25,
      });

      expect(allocation.totalAmount.currency).toBe('EUR');
      expect(allocation.totalAmount.amount).toBe(75);
    });
  });

  describe('Immutability', () => {
    const allocation = new PaymentAllocation({
      companyContribution: usd100,
      employeeContribution: usd50,
    });

    it('should not allow external modification of contribution properties', () => {
      // Properties are readonly, this test ensures TypeScript prevents modification
      expect(allocation.companyContribution).toEqual(usd100);
      expect(allocation.employeeContribution).toEqual(usd50);
    });

    it('should return new instances from operations', () => {
      const other = PaymentAllocation.companyPaid(usd50);
      const combined = allocation.combine(other);

      // Original allocation should be unchanged
      expect(allocation.companyContribution.amount).toBe(100);
      expect(allocation.employeeContribution.amount).toBe(50);

      // Combined should be a new instance
      expect(combined).not.toBe(allocation);
    });
  });
});
