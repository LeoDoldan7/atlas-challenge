import { HealthcareSubscriptionFactory } from '../factories/healthcare-subscription.factory';
import {
  SubscriptionConfig,
  SubscriptionTemplate,
} from '../factories/subscription-factory.interface';
import { SubscriptionPeriod } from '../value-objects/subscription-period.value-object';
import { PaymentAllocation } from '../value-objects/payment-allocation.value-object';
import { Money } from '../value-objects/money.value-object';
import { ItemRole } from '@prisma/client';

describe('HealthcareSubscriptionFactory', () => {
  let factory: HealthcareSubscriptionFactory;
  let period: SubscriptionPeriod;
  const usd100 = new Money(100, 'USD');
  const usd50 = new Money(50, 'USD');

  beforeEach(() => {
    factory = new HealthcareSubscriptionFactory();
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    period = new SubscriptionPeriod(startDate, endDate);
  });

  describe('Basic Subscription Creation', () => {
    it('should create employee-only subscription', () => {
      const config: SubscriptionConfig = {
        companyId: 'comp_123',
        employeeId: 'emp_456',
        planId: 'plan_789',
        period,
        members: [
          {
            memberType: ItemRole.employee,
            memberId: 'emp_456',
            monthlyPrice: usd100,
            paymentAllocation: PaymentAllocation.companyPaid(usd100),
          },
        ],
      };

      const subscription = factory.createSubscription(config);

      expect(subscription.id).toBeDefined();
      expect(subscription.companyId).toBe('comp_123');
      expect(subscription.employeeId).toBe('emp_456');
      expect(subscription.planId).toBe('plan_789');
      expect(subscription.getItems()).toHaveLength(1);
      expect(subscription.getTotalMonthlyAmount().amount).toBe(100);
    });

    it('should create family subscription', () => {
      const config: SubscriptionConfig = {
        companyId: 'comp_123',
        employeeId: 'emp_456',
        planId: 'plan_789',
        period,
        members: [
          {
            memberType: ItemRole.employee,
            memberId: 'emp_456',
            monthlyPrice: usd100,
            paymentAllocation: PaymentAllocation.companyPaid(usd100),
          },
          {
            memberType: ItemRole.spouse,
            memberId: 'spouse_789',
            monthlyPrice: usd50,
            paymentAllocation: PaymentAllocation.hybrid(
              new Money(25, 'USD'),
              new Money(25, 'USD'),
            ),
          },
          {
            memberType: ItemRole.child,
            memberId: 'child_101',
            monthlyPrice: new Money(25, 'USD'),
            paymentAllocation: PaymentAllocation.employeePaid(
              new Money(25, 'USD'),
            ),
          },
        ],
      };

      const subscription = factory.createSubscription(config);

      expect(subscription.getItems()).toHaveLength(3);
      expect(subscription.getTotalMonthlyAmount().amount).toBe(175);
    });
  });

  describe('Convenience Factory Methods', () => {
    it('should create employee-only subscription using convenience method', () => {
      const subscription = factory.createEmployeeOnlySubscription(
        'comp_123',
        'emp_456',
        'plan_789',
        usd100,
        80, // 80% company contribution
      );

      expect(subscription.getItems()).toHaveLength(1);
      expect(subscription.getTotalMonthlyAmount().amount).toBe(100);

      const allocation = subscription.getAggregatePaymentAllocation();
      expect(allocation.getCompanyPercentage()).toBeCloseTo(80, 1);
    });

    it('should create family subscription using convenience method', () => {
      const subscription = factory.createFamilySubscription(
        'comp_123',
        'emp_456',
        'plan_789',
        {
          employeePrice: usd100,
          spousePrice: usd50,
          childPrice: new Money(25, 'USD'),
          spouseId: 'spouse_789',
          childrenIds: ['child_101', 'child_102'],
          companyContributionPercentage: 70,
        },
      );

      expect(subscription.getItems()).toHaveLength(4); // employee + spouse + 2 children
      expect(subscription.getTotalMonthlyAmount().amount).toBe(200);

      const allocation = subscription.getAggregatePaymentAllocation();
      expect(allocation.getCompanyPercentage()).toBeCloseTo(70, 1);
    });

    it('should create family subscription with employee only when no family members provided', () => {
      const subscription = factory.createFamilySubscription(
        'comp_123',
        'emp_456',
        'plan_789',
        {
          employeePrice: usd100,
        },
      );

      expect(subscription.getItems()).toHaveLength(1);
      expect(subscription.getTotalMonthlyAmount().amount).toBe(100);
    });
  });

  describe('Template-Based Creation', () => {
    it('should create subscription from template', () => {
      const template: SubscriptionTemplate = {
        name: 'Family Plan',
        description: 'Standard family healthcare plan',
        defaultMembers: [
          {
            memberType: ItemRole.employee,
            monthlyPrice: usd100,
            paymentAllocation: PaymentAllocation.fromPercentage(usd100, 80),
          },
          {
            memberType: ItemRole.spouse,
            monthlyPrice: usd50,
            paymentAllocation: PaymentAllocation.fromPercentage(usd50, 80),
          },
        ],
        businessRules: {
          maxChildren: 5,
          companyContributionPercentage: 80,
        },
      };

      const subscription = factory.createFromTemplate(template, {
        companyId: 'comp_123',
        employeeId: 'emp_456',
        planId: 'plan_789',
        period,
      });

      expect(subscription.getItems()).toHaveLength(2);
      expect(subscription.getTotalMonthlyAmount().amount).toBe(150);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required fields', () => {
      const invalidConfig = {
        companyId: '',
        employeeId: 'emp_456',
        planId: 'plan_789',
        period,
      } as SubscriptionConfig;

      const validation = factory.validateConfiguration(invalidConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Company ID is required');
    });

    it('should validate member configuration', () => {
      const config: SubscriptionConfig = {
        companyId: 'comp_123',
        employeeId: 'emp_456',
        planId: 'plan_789',
        period,
        members: [
          {
            memberType: ItemRole.spouse, // No employee first
            memberId: 'spouse_789',
            monthlyPrice: usd50,
            paymentAllocation: PaymentAllocation.companyPaid(usd50),
          },
        ],
      };

      const validation = factory.validateConfiguration(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'At least one employee must be included',
      );
    });

    it('should enforce maximum children limit', () => {
      const config: SubscriptionConfig = {
        companyId: 'comp_123',
        employeeId: 'emp_456',
        planId: 'plan_789',
        period,
        members: [
          {
            memberType: ItemRole.employee,
            memberId: 'emp_456',
            monthlyPrice: usd100,
            paymentAllocation: PaymentAllocation.companyPaid(usd100),
          },
          // Add 11 children (exceeds default limit of 10)
          ...Array.from({ length: 11 }, (_, i) => ({
            memberType: ItemRole.child,
            memberId: `child_${i}`,
            monthlyPrice: new Money(25, 'USD'),
            paymentAllocation: PaymentAllocation.companyPaid(
              new Money(25, 'USD'),
            ),
          })),
        ],
      };

      const validation = factory.validateConfiguration(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Maximum 10 children allowed');
    });

    it('should prevent duplicate member IDs', () => {
      const config: SubscriptionConfig = {
        companyId: 'comp_123',
        employeeId: 'emp_456',
        planId: 'plan_789',
        period,
        members: [
          {
            memberType: ItemRole.employee,
            memberId: 'emp_456',
            monthlyPrice: usd100,
            paymentAllocation: PaymentAllocation.companyPaid(usd100),
          },
          {
            memberType: ItemRole.employee, // Duplicate
            memberId: 'emp_456',
            monthlyPrice: usd100,
            paymentAllocation: PaymentAllocation.companyPaid(usd100),
          },
        ],
      };

      const validation = factory.validateConfiguration(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Only one employee allowed per subscription',
      );
      expect(validation.errors).toContain('Duplicate member IDs found');
    });

    it('should validate payment configuration', () => {
      const config: SubscriptionConfig = {
        companyId: 'comp_123',
        employeeId: 'emp_456',
        planId: 'plan_789',
        period,
        members: [
          {
            memberType: ItemRole.employee,
            memberId: 'emp_456',
            monthlyPrice: new Money(0, 'USD'), // Invalid price
            paymentAllocation: PaymentAllocation.companyPaid(
              new Money(0, 'USD'),
            ),
          },
        ],
      };

      const validation = factory.validateConfiguration(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Monthly price must be positive for member emp_456',
      );
    });
  });

  describe('Business Rules Enforcement', () => {
    it('should enforce custom business rules', () => {
      const customRules = {
        requiresSpouseForChildren: true,
        maxChildren: 5,
        allowedPaymentSources: ['COMPANY'],
      };

      const customFactory = new HealthcareSubscriptionFactory(customRules);

      expect(() =>
        customFactory.createSubscription({
          companyId: 'comp_123',
          employeeId: 'emp_456',
          planId: 'plan_789',
          period,
          members: [
            {
              memberType: ItemRole.employee,
              memberId: 'emp_456',
              monthlyPrice: usd100,
              paymentAllocation: PaymentAllocation.companyPaid(usd100),
            },
            {
              memberType: ItemRole.child,
              memberId: 'child_101',
              monthlyPrice: new Money(25, 'USD'),
              paymentAllocation: PaymentAllocation.companyPaid(
                new Money(25, 'USD'),
              ),
            },
          ],
        }),
      ).toThrow('Spouse is required when adding children');
    });

    it('should validate allowed payment sources', () => {
      const restrictedFactory = new HealthcareSubscriptionFactory({
        allowedPaymentSources: ['COMPANY'],
      });

      const config: SubscriptionConfig = {
        companyId: 'comp_123',
        employeeId: 'emp_456',
        planId: 'plan_789',
        period,
        members: [
          {
            memberType: ItemRole.employee,
            memberId: 'emp_456',
            monthlyPrice: usd100,
            paymentAllocation: PaymentAllocation.employeePaid(usd100), // Not allowed
          },
        ],
      };

      const validation = restrictedFactory.validateConfiguration(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Payment source EMPLOYEE_WALLET not allowed for member emp_456',
      );
    });
  });

  describe('Member Priority Sorting', () => {
    it('should add members in correct priority order', () => {
      const config: SubscriptionConfig = {
        companyId: 'comp_123',
        employeeId: 'emp_456',
        planId: 'plan_789',
        period,
        members: [
          // Deliberately out of order
          {
            memberType: ItemRole.child,
            memberId: 'child_101',
            monthlyPrice: new Money(25, 'USD'),
            paymentAllocation: PaymentAllocation.companyPaid(
              new Money(25, 'USD'),
            ),
          },
          {
            memberType: ItemRole.spouse,
            memberId: 'spouse_789',
            monthlyPrice: usd50,
            paymentAllocation: PaymentAllocation.companyPaid(usd50),
          },
          {
            memberType: ItemRole.employee,
            memberId: 'emp_456',
            monthlyPrice: usd100,
            paymentAllocation: PaymentAllocation.companyPaid(usd100),
          },
        ],
      };

      const subscription = factory.createSubscription(config);
      const items = subscription.getItems();

      expect(items[0].memberType).toBe(ItemRole.employee);
      expect(items[1].memberType).toBe(ItemRole.spouse);
      expect(items[2].memberType).toBe(ItemRole.child);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid configuration', () => {
      const config: SubscriptionConfig = {
        companyId: '',
        employeeId: 'emp_456',
        planId: 'plan_789',
        period,
      };

      expect(() => factory.createSubscription(config)).toThrow(
        'Invalid subscription configuration',
      );
    });

    it('should handle member addition failures gracefully', () => {
      const config: SubscriptionConfig = {
        companyId: 'comp_123',
        employeeId: 'emp_456',
        planId: 'plan_789',
        period,
        members: [
          {
            memberType: ItemRole.spouse, // Will fail - no employee first
            memberId: 'spouse_789',
            monthlyPrice: usd50,
            paymentAllocation: PaymentAllocation.companyPaid(usd50),
          },
        ],
      };

      expect(() => factory.createSubscription(config)).toThrow(
        'Invalid subscription configuration',
      );
    });
  });
});
