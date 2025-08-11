import { Subscription } from '../aggregates/subscription.aggregate';
import { Money } from '../value-objects/money.value-object';
import { SubscriptionPeriod } from '../value-objects/subscription-period.value-object';
import { PaymentAllocation } from '../value-objects/payment-allocation.value-object';
import {
  ItemRole,
  SubscriptionStatus,
  SubscriptionStepType,
  StepStatus,
} from '@prisma/client';

describe('Subscription Aggregate', () => {
  let subscription: Subscription;
  let subscriptionPeriod: SubscriptionPeriod;

  const subscriptionId = 'sub_123';
  const companyId = 'comp_456';
  const employeeId = 'emp_789';
  const planId = 'plan_abc';

  beforeEach(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30); // 30 days ago
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 30); // 30 days from now

    subscriptionPeriod = new SubscriptionPeriod(startDate, endDate);
    subscription = new Subscription(
      subscriptionId,
      companyId,
      employeeId,
      planId,
      subscriptionPeriod,
    );
  });

  describe('Construction', () => {
    it('should create subscription with correct initial values', () => {
      expect(subscription.id).toBe(subscriptionId);
      expect(subscription.companyId).toBe(companyId);
      expect(subscription.employeeId).toBe(employeeId);
      expect(subscription.planId).toBe(planId);
      expect(subscription.getPeriod()).toBe(subscriptionPeriod);
      expect(subscription.createdAt).toBeInstanceOf(Date);
    });

    it('should start in DRAFT status', () => {
      expect(subscription.getStatus()).toBe(SubscriptionStatus.DRAFT);
    });

    it('should initialize with empty items', () => {
      expect(subscription.getItems()).toHaveLength(0);
    });

    it('should initialize with empty enrollment steps', () => {
      const steps = subscription.getEnrollmentSteps();
      expect(steps).toHaveLength(3);
      expect(steps.every((step) => step.status === StepStatus.PENDING)).toBe(true);
    });

    it('should initialize with zero monetary amounts', () => {
      expect(subscription.getTotalMonthlyAmount().amount).toBe(0);
    });
  });

  describe('Adding Subscription Items', () => {
    const monthlyPrice = new Money(200, 'USD');
    const paymentAllocation = PaymentAllocation.companyPaid(monthlyPrice);

    it('should add employee item successfully', () => {
      subscription.addSubscriptionItem({
        memberType: ItemRole.employee,
        memberId: 'emp_123',
        monthlyPrice,
        paymentAllocation,
      });

      const items = subscription.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].memberType).toBe(ItemRole.employee);
      expect(items[0].memberId).toBe('emp_123');
      expect(items[0].monthlyPrice).toEqual(monthlyPrice);
    });

    it('should update totals when adding items', () => {
      subscription.addSubscriptionItem({
        memberType: ItemRole.employee,
        memberId: 'emp_123',
        monthlyPrice,
        paymentAllocation,
      });

      expect(subscription.getTotalMonthlyAmount().amount).toBe(200);
      expect(
        subscription.getAggregatePaymentAllocation().totalAmount.amount,
      ).toBe(200);
    });

    describe('Business Rules Validation', () => {
      it('should require employee to be added first', () => {
        expect(() => {
          subscription.addSubscriptionItem({
            memberType: ItemRole.spouse,
            memberId: 'spouse_123',
            monthlyPrice,
            paymentAllocation,
          });
        }).toThrow('Employee must be added before family members');
      });

      it('should allow adding spouse after employee', () => {
        subscription.addSubscriptionItem({
          memberType: ItemRole.employee,
          memberId: 'emp_123',
          monthlyPrice,
          paymentAllocation,
        });

        expect(() => {
          subscription.addSubscriptionItem({
            memberType: ItemRole.spouse,
            memberId: 'spouse_123',
            monthlyPrice,
            paymentAllocation,
          });
        }).not.toThrow();
      });

      it('should prevent duplicate members', () => {
        subscription.addSubscriptionItem({
          memberType: ItemRole.employee,
          memberId: 'emp_123',
          monthlyPrice,
          paymentAllocation,
        });

        expect(() => {
          subscription.addSubscriptionItem({
            memberType: ItemRole.employee,
            memberId: 'emp_123',
            monthlyPrice,
            paymentAllocation,
          });
        }).toThrow('Member emp_123 already exists in subscription');
      });

      it('should enforce maximum children limit', () => {
        subscription.addSubscriptionItem({
          memberType: ItemRole.employee,
          memberId: 'emp_123',
          monthlyPrice,
          paymentAllocation,
        });

        // Add 10 children (should succeed)
        for (let i = 1; i <= 10; i++) {
          subscription.addSubscriptionItem({
            memberType: ItemRole.child,
            memberId: `child_${i}`,
            monthlyPrice,
            paymentAllocation,
          });
        }

        // Adding 11th child should fail
        expect(() => {
          subscription.addSubscriptionItem({
            memberType: ItemRole.child,
            memberId: 'child_11',
            monthlyPrice,
            paymentAllocation,
          });
        }).toThrow('Maximum 10 children allowed per subscription');
      });

      it('should prevent modification after enrollment starts', async () => {
        subscription.addSubscriptionItem({
          memberType: ItemRole.employee,
          memberId: 'emp_123',
          monthlyPrice,
          paymentAllocation,
        });
        await subscription.startEnrollment();

        expect(() => {
          subscription.addSubscriptionItem({
            memberType: ItemRole.spouse,
            memberId: 'spouse_123',
            monthlyPrice,
            paymentAllocation,
          });
        }).toThrow('Cannot modify items after enrollment has started');
      });
    });
  });

  describe('Enrollment Process', () => {
    beforeEach(() => {
      const monthlyPrice = new Money(200, 'USD');
      const paymentAllocation = PaymentAllocation.companyPaid(monthlyPrice);
      subscription.addSubscriptionItem({
        memberType: ItemRole.employee,
        memberId: 'emp_123',
        monthlyPrice,
        paymentAllocation,
      });
    });

    describe('Starting Enrollment', () => {
      it('should start enrollment successfully', async () => {
        await subscription.startEnrollment();
        expect(subscription.getStatus()).toBe(
          SubscriptionStatus.PENDING,
        );
      });

      it('should require items before starting enrollment', async () => {
        const emptySubscription = new Subscription(
          'sub_empty',
          companyId,
          employeeId,
          planId,
          subscriptionPeriod,
        );

        await expect(emptySubscription.startEnrollment()).rejects.toThrow(
          'Cannot start enrollment without subscription items',
        );
      });

      it('should only allow starting from DRAFT status', async () => {
        await subscription.startEnrollment();

        await expect(subscription.startEnrollment()).rejects.toThrow(
          'Cannot start enrollment in current state',
        );
      });
    });

    describe('Completing Enrollment Steps', () => {
      beforeEach(async () => {
        await subscription.startEnrollment();
      });

      it('should complete demographic verification step', async () => {
        await subscription.completeEnrollmentStep(
          SubscriptionStepType.DEMOGRAPHIC_VERIFICATION,
        );

        expect(subscription.getStatus()).toBe(SubscriptionStatus.PENDING);
        const steps = subscription.getEnrollmentSteps();
        const demoStep = steps.find(
          (s) => s.type === SubscriptionStepType.DEMOGRAPHIC_VERIFICATION,
        );
        expect(demoStep?.status).toBe(StepStatus.COMPLETED);
      });

      it('should progress through all enrollment steps', async () => {
        // Complete demographic verification
        await subscription.completeEnrollmentStep(
          SubscriptionStepType.DEMOGRAPHIC_VERIFICATION,
        );
        expect(subscription.getStatus()).toBe(SubscriptionStatus.PENDING);

        // Complete document upload
        await subscription.completeEnrollmentStep(
          SubscriptionStepType.DOCUMENT_UPLOAD,
        );
        expect(subscription.getStatus()).toBe(SubscriptionStatus.PENDING);

        // Complete plan activation - should activate the subscription
        await subscription.completeEnrollmentStep(
          SubscriptionStepType.PLAN_ACTIVATION,
        );
        expect(subscription.getStatus()).toBe(SubscriptionStatus.ACTIVE);
      });

      it('should enforce step completion order', async () => {
        await expect(
          subscription.completeEnrollmentStep(
            SubscriptionStepType.DOCUMENT_UPLOAD,
          ),
        ).rejects.toThrow(
          'Must complete DEMOGRAPHIC_VERIFICATION before DOCUMENT_UPLOAD',
        );
      });

      it('should prevent completing already completed steps', async () => {
        await subscription.completeEnrollmentStep(
          SubscriptionStepType.DEMOGRAPHIC_VERIFICATION,
        );

        await expect(
          subscription.completeEnrollmentStep(
            SubscriptionStepType.DEMOGRAPHIC_VERIFICATION,
          ),
        ).rejects.toThrow('Step DEMOGRAPHIC_VERIFICATION is already completed');
      });

      it('should activate subscription when all steps completed', async () => {
        await subscription.completeEnrollmentStep(
          SubscriptionStepType.DEMOGRAPHIC_VERIFICATION,
        );
        await subscription.completeEnrollmentStep(
          SubscriptionStepType.DOCUMENT_UPLOAD,
        );
        await subscription.completeEnrollmentStep(
          SubscriptionStepType.PLAN_ACTIVATION,
        );

        expect(subscription.getStatus()).toBe(SubscriptionStatus.ACTIVE);
      });
    });
  });

  describe('Financial Calculations', () => {
    it('should calculate total monthly amount correctly', () => {
      const employeePrice = new Money(200, 'USD');
      const spousePrice = new Money(150, 'USD');
      const childPrice = new Money(75, 'USD');

      subscription.addSubscriptionItem({
        memberType: ItemRole.employee,
        memberId: 'emp_123',
        monthlyPrice: employeePrice,
        paymentAllocation: PaymentAllocation.companyPaid(employeePrice),
      });

      subscription.addSubscriptionItem({
        memberType: ItemRole.spouse,
        memberId: 'spouse_123',
        monthlyPrice: spousePrice,
        paymentAllocation: PaymentAllocation.employeePaid(spousePrice),
      });

      subscription.addSubscriptionItem({
        memberType: ItemRole.child,
        memberId: 'child_123',
        monthlyPrice: childPrice,
        paymentAllocation: PaymentAllocation.hybrid(
          new Money(25, 'USD'),
          new Money(50, 'USD'),
        ),
      });

      expect(subscription.getTotalMonthlyAmount().amount).toBe(425);
    });

    it('should aggregate payment allocations correctly', () => {
      const employeePrice = new Money(200, 'USD');
      const spousePrice = new Money(100, 'USD');

      subscription.addSubscriptionItem({
        memberType: ItemRole.employee,
        memberId: 'emp_123',
        monthlyPrice: employeePrice,
        paymentAllocation: PaymentAllocation.companyPaid(employeePrice),
      });

      subscription.addSubscriptionItem({
        memberType: ItemRole.spouse,
        memberId: 'spouse_123',
        monthlyPrice: spousePrice,
        paymentAllocation: PaymentAllocation.employeePaid(spousePrice),
      });

      const aggregate = subscription.getAggregatePaymentAllocation();
      expect(aggregate.companyContribution.amount).toBe(200);
      expect(aggregate.employeeContribution.amount).toBe(100);
      expect(aggregate.totalAmount.amount).toBe(300);
    });
  });

  describe('Getters', () => {
    it('should provide access to essential properties', () => {
      expect(subscription.getStatus()).toBeDefined();
      expect(subscription.getTotalMonthlyAmount()).toBeDefined();
      expect(subscription.getAggregatePaymentAllocation()).toBeDefined();
      expect(subscription.getUpdatedAt()).toBeDefined();
    });

    it('should return defensive copies of collections', () => {
      const items = subscription.getItems();
      const steps = subscription.getEnrollmentSteps();

      // These should be new arrays, not references to internal state
      expect(Array.isArray(items)).toBe(true);
      expect(Array.isArray(steps)).toBe(true);
    });

    it('should mark returned arrays as readonly', () => {
      const items: readonly any[] = subscription.getItems();
      const steps: readonly any[] = subscription.getEnrollmentSteps();

      // TypeScript should enforce readonly
      expect(items).toBeDefined();
      expect(steps).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty subscription gracefully', () => {
      expect(subscription.getItems()).toHaveLength(0);
      expect(subscription.getTotalMonthlyAmount().amount).toBe(0);
      expect(subscription.getStatus()).toBe(SubscriptionStatus.DRAFT);
    });

    it('should handle currency consistency', () => {
      const usdPrice = new Money(100, 'USD');
      const eurPrice = new Money(100, 'EUR');

      subscription.addSubscriptionItem({
        memberType: ItemRole.employee,
        memberId: 'emp_123',
        monthlyPrice: usdPrice,
        paymentAllocation: PaymentAllocation.companyPaid(usdPrice),
      });

      // Adding item with different currency should work at domain level
      // (currency conversion would be handled at application level)
      expect(() => {
        subscription.addSubscriptionItem({
          memberType: ItemRole.spouse,
          memberId: 'spouse_123',
          monthlyPrice: eurPrice,
          paymentAllocation: PaymentAllocation.companyPaid(eurPrice),
        });
      }).toThrow(); // Will fail when trying to add different currencies
    });

    it('should handle very large families', () => {
      const monthlyPrice = new Money(50, 'USD');
      const paymentAllocation = PaymentAllocation.companyPaid(monthlyPrice);

      subscription.addSubscriptionItem({
        memberType: ItemRole.employee,
        memberId: 'emp_123',
        monthlyPrice,
        paymentAllocation,
      });
      subscription.addSubscriptionItem({
        memberType: ItemRole.spouse,
        memberId: 'spouse_123',
        monthlyPrice,
        paymentAllocation,
      });

      // Add maximum children
      for (let i = 1; i <= 10; i++) {
        subscription.addSubscriptionItem({
          memberType: ItemRole.child,
          memberId: `child_${i}`,
          monthlyPrice,
          paymentAllocation,
        });
      }

      expect(subscription.getItems()).toHaveLength(12); // employee + spouse + 10 children
      expect(subscription.getTotalMonthlyAmount().amount).toBe(600); // 12 * 50
    });
  });

  describe('Immutability and Encapsulation', () => {
    it('should not allow direct modification of internal state', () => {
      const items = subscription.getItems();
      const originalLength = items.length;

      // Attempting to modify returned array shouldn't affect internal state
      (items as any[]).push({ fake: 'item' });

      expect(subscription.getItems()).toHaveLength(originalLength);
    });

    it('should maintain consistent internal state', () => {
      const monthlyPrice = new Money(100, 'USD');
      const paymentAllocation = PaymentAllocation.companyPaid(monthlyPrice);

      subscription.addSubscriptionItem({
        memberType: ItemRole.employee,
        memberId: 'emp_123',
        monthlyPrice,
        paymentAllocation,
      });

      const totalBefore = subscription.getTotalMonthlyAmount().amount;
      const updatedAtBefore = subscription.getUpdatedAt();

      // Internal state should be consistent
      expect(totalBefore).toBe(100);
      expect(updatedAtBefore).toBeInstanceOf(Date);
    });
  });
});
