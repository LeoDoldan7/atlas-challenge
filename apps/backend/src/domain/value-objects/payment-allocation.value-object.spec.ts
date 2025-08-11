import { Money } from './money.value-object';
import {
  PaymentAllocation,
  PaymentSource,
} from './payment-allocation.value-object';

describe('PaymentAllocation', () => {
  describe('fromPercentage', () => {
    it('should handle 100% company contribution correctly', () => {
      const totalAmount = Money.fromCents(50000, 'USD'); // $500
      const allocation = PaymentAllocation.fromPercentage(totalAmount, 100);

      expect(allocation.companyContribution.toCents()).toBe(50000);
      expect(allocation.employeeContribution.toCents()).toBe(0);
      expect(allocation.getCompanyPercentage()).toBe(100);
      expect(allocation.getEmployeePercentage()).toBe(0);
      expect(allocation.source).toBe(PaymentSource.COMPANY);
    });

    it('should handle 0% company contribution correctly', () => {
      const totalAmount = Money.fromCents(50000, 'USD');
      const allocation = PaymentAllocation.fromPercentage(totalAmount, 0);

      expect(allocation.companyContribution.toCents()).toBe(0);
      expect(allocation.employeeContribution.toCents()).toBe(50000);
      expect(allocation.getCompanyPercentage()).toBe(0);
      expect(allocation.getEmployeePercentage()).toBe(100);
      expect(allocation.source).toBe(PaymentSource.EMPLOYEE_WALLET);
    });

    it('should handle 50/50 split correctly', () => {
      const totalAmount = Money.fromCents(50000, 'USD');
      const allocation = PaymentAllocation.fromPercentage(totalAmount, 50);

      expect(allocation.companyContribution.toCents()).toBe(25000);
      expect(allocation.employeeContribution.toCents()).toBe(25000);
      expect(allocation.getCompanyPercentage()).toBe(50);
      expect(allocation.getEmployeePercentage()).toBe(50);
      expect(allocation.source).toBe(PaymentSource.HYBRID);
    });

    it('should handle 75/25 split correctly', () => {
      const totalAmount = Money.fromCents(10000, 'USD'); // $100
      const allocation = PaymentAllocation.fromPercentage(totalAmount, 75);

      expect(allocation.companyContribution.toCents()).toBe(7500);
      expect(allocation.employeeContribution.toCents()).toBe(2500);
      expect(allocation.getCompanyPercentage()).toBe(75);
      expect(allocation.getEmployeePercentage()).toBe(25);
      expect(allocation.source).toBe(PaymentSource.HYBRID);
    });

    it('should handle fractional percentages correctly', () => {
      const totalAmount = Money.fromCents(10000, 'USD');
      const allocation = PaymentAllocation.fromPercentage(totalAmount, 33.33);

      expect(allocation.companyContribution.toCents()).toBe(3333);
      expect(allocation.employeeContribution.toCents()).toBe(6667);
      expect(allocation.getCompanyPercentage()).toBeCloseTo(33.33, 1);
      expect(allocation.getEmployeePercentage()).toBeCloseTo(66.67, 1);
    });

    it('should throw error for invalid percentages', () => {
      const totalAmount = Money.fromCents(10000, 'USD');

      expect(() => PaymentAllocation.fromPercentage(totalAmount, -1)).toThrow(
        'Company percentage must be between 0 and 100',
      );

      expect(() => PaymentAllocation.fromPercentage(totalAmount, 101)).toThrow(
        'Company percentage must be between 0 and 100',
      );
    });
  });

  describe('static factory methods', () => {
    it('should create company-paid allocation correctly', () => {
      const amount = Money.fromCents(50000, 'USD');
      const allocation = PaymentAllocation.companyPaid(amount);

      expect(allocation.companyContribution.toCents()).toBe(50000);
      expect(allocation.employeeContribution.toCents()).toBe(0);
      expect(allocation.source).toBe(PaymentSource.COMPANY);
      expect(allocation.totalAmount.toCents()).toBe(50000);
    });

    it('should create employee-paid allocation correctly', () => {
      const amount = Money.fromCents(50000, 'USD');
      const allocation = PaymentAllocation.employeePaid(amount);

      expect(allocation.companyContribution.toCents()).toBe(0);
      expect(allocation.employeeContribution.toCents()).toBe(50000);
      expect(allocation.source).toBe(PaymentSource.EMPLOYEE_WALLET);
      expect(allocation.totalAmount.toCents()).toBe(50000);
    });

    it('should create hybrid allocation correctly', () => {
      const companyAmount = Money.fromCents(30000, 'USD');
      const employeeAmount = Money.fromCents(20000, 'USD');
      const allocation = PaymentAllocation.hybrid(
        companyAmount,
        employeeAmount,
      );

      expect(allocation.companyContribution.toCents()).toBe(30000);
      expect(allocation.employeeContribution.toCents()).toBe(20000);
      expect(allocation.source).toBe(PaymentSource.HYBRID);
      expect(allocation.totalAmount.toCents()).toBe(50000);
    });
  });

  describe('combine', () => {
    it('should combine allocations with 100% company contribution', () => {
      const allocation1 = PaymentAllocation.fromPercentage(
        Money.fromCents(50000, 'USD'),
        100,
      );
      const allocation2 = PaymentAllocation.fromPercentage(
        Money.fromCents(60000, 'USD'),
        100,
      );
      const allocation3 = PaymentAllocation.fromPercentage(
        Money.fromCents(30000, 'USD'),
        100,
      );

      const combined = allocation1.combine(allocation2).combine(allocation3);

      expect(combined.companyContribution.toCents()).toBe(140000);
      expect(combined.employeeContribution.toCents()).toBe(0);
      expect(combined.totalAmount.toCents()).toBe(140000);
      expect(combined.getCompanyPercentage()).toBe(100);
      expect(combined.getEmployeePercentage()).toBe(0);
      expect(combined.source).toBe(PaymentSource.COMPANY);
    });

    it('should combine allocations with mixed percentages', () => {
      const allocation1 = PaymentAllocation.fromPercentage(
        Money.fromCents(50000, 'USD'),
        80,
      ); // Company: 40000, Employee: 10000
      const allocation2 = PaymentAllocation.fromPercentage(
        Money.fromCents(60000, 'USD'),
        50,
      ); // Company: 30000, Employee: 30000
      const allocation3 = PaymentAllocation.fromPercentage(
        Money.fromCents(30000, 'USD'),
        100,
      ); // Company: 30000, Employee: 0

      const combined = allocation1.combine(allocation2).combine(allocation3);

      expect(combined.companyContribution.toCents()).toBe(100000);
      expect(combined.employeeContribution.toCents()).toBe(40000);
      expect(combined.totalAmount.toCents()).toBe(140000);
      expect(combined.getCompanyPercentage()).toBeCloseTo(71.43, 1);
      expect(combined.getEmployeePercentage()).toBeCloseTo(28.57, 1);
      expect(combined.source).toBe(PaymentSource.HYBRID);
    });
  });

  describe('canBeProcessed', () => {
    it('should validate wallet balance for 100% company contribution', () => {
      const allocation = PaymentAllocation.fromPercentage(
        Money.fromCents(50000, 'USD'),
        100,
      );
      const walletBalance = Money.fromCents(0, 'USD'); // Empty wallet

      expect(allocation.canBeProcessed(walletBalance)).toBe(true);
    });

    it('should validate wallet balance for employee contribution', () => {
      const allocation = PaymentAllocation.fromPercentage(
        Money.fromCents(50000, 'USD'),
        75,
      ); // Employee pays 12500

      const insufficientBalance = Money.fromCents(10000, 'USD');
      const sufficientBalance = Money.fromCents(15000, 'USD');

      expect(allocation.canBeProcessed(insufficientBalance)).toBe(false);
      expect(allocation.canBeProcessed(sufficientBalance)).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize 100% company contribution correctly', () => {
      const allocation = PaymentAllocation.fromPercentage(
        Money.fromCents(50000, 'USD'),
        100,
      );
      const json = allocation.toJSON();

      expect(json).toEqual({
        companyContribution: {
          amount: 500,
          currency: 'USD',
        },
        employeeContribution: {
          amount: 0,
          currency: 'USD',
        },
        totalAmount: {
          amount: 500,
          currency: 'USD',
        },
        source: PaymentSource.COMPANY,
        companyPercentage: 100,
        employeePercentage: 0,
      });
    });

    it('should serialize mixed contribution correctly', () => {
      const allocation = PaymentAllocation.fromPercentage(
        Money.fromCents(10000, 'USD'),
        60,
      );
      const json = allocation.toJSON();

      expect(json).toEqual({
        companyContribution: {
          amount: 60,
          currency: 'USD',
        },
        employeeContribution: {
          amount: 40,
          currency: 'USD',
        },
        totalAmount: {
          amount: 100,
          currency: 'USD',
        },
        source: PaymentSource.HYBRID,
        companyPercentage: 60,
        employeePercentage: 40,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle zero amount allocations', () => {
      const allocation = PaymentAllocation.fromPercentage(
        Money.fromCents(0, 'USD'),
        50,
      );

      expect(allocation.companyContribution.toCents()).toBe(0);
      expect(allocation.employeeContribution.toCents()).toBe(0);
      expect(allocation.totalAmount.toCents()).toBe(0);
      expect(allocation.getCompanyPercentage()).toBe(0);
      expect(allocation.getEmployeePercentage()).toBe(0);
    });

    it('should handle very large amounts', () => {
      const largeAmount = Money.fromCents(1000000000, 'USD'); // $10 million in cents
      const allocation = PaymentAllocation.fromPercentage(largeAmount, 100);

      expect(allocation.companyContribution.toCents()).toBe(1000000000);
      expect(allocation.employeeContribution.toCents()).toBe(0);
      expect(allocation.getCompanyPercentage()).toBe(100);
    });

    it('should maintain currency consistency', () => {
      expect(() => {
        new PaymentAllocation({
          companyContribution: Money.fromCents(5000, 'USD'),
          employeeContribution: Money.fromCents(5000, 'EUR'),
        });
      }).toThrow('All contributions must be in the same currency');
    });
  });
});
