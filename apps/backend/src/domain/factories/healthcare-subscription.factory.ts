import {
  SubscriptionFactory,
  SubscriptionConfig,
  SubscriptionBusinessRules,
  SubscriptionMemberConfig,
} from './subscription-factory.interface';
import { Subscription } from '../aggregates/subscription.aggregate';
import { PaymentAllocation } from '../value-objects/payment-allocation.value-object';
import { Money } from '../value-objects/money.value-object';
import { SubscriptionPeriod } from '../value-objects/subscription-period.value-object';
import { ItemRole } from '@prisma/client';

export class HealthcareSubscriptionFactory implements SubscriptionFactory {
  private businessRules: SubscriptionBusinessRules;

  constructor(businessRules?: SubscriptionBusinessRules) {
    this.businessRules = {
      requiresSpouseForChildren: false,
      maxChildren: 10,
      minimumAge: {
        [ItemRole.employee]: 18,
        [ItemRole.spouse]: 18,
        [ItemRole.child]: 0,
      },
      allowedPaymentSources: ['COMPANY', 'EMPLOYEE_WALLET', 'HYBRID'],
      companyContributionPercentage: 75,
      ...businessRules,
    };
  }

  createSubscription(config: SubscriptionConfig): Subscription {
    const subscription = new Subscription(
      this.generateSubscriptionId(),
      config.companyId,
      config.employeeId,
      config.planId,
      config.period,
    );

    if (config.members) {
      const sortedMembers = this.sortMembersByPriority(config.members);

      for (const memberConfig of sortedMembers) {
        try {
          subscription.addSubscriptionItem(memberConfig);
        } catch (error) {
          throw new Error(
            `Failed to add member ${memberConfig.memberId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }
    }

    return subscription;
  }

  createEmployeeOnlySubscription({
    companyId,
    employeeId,
    planId,
    monthlyPrice,
    companyContributionPercentage = 75,
  }: {
    companyId: string;
    employeeId: string;
    planId: string;
    monthlyPrice: Money;
    companyContributionPercentage?: number;
  }): Subscription {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + 1);

    const period = new SubscriptionPeriod(startDate, endDate);

    const paymentAllocation = PaymentAllocation.fromPercentage(
      monthlyPrice,
      companyContributionPercentage,
    );

    const config: SubscriptionConfig = {
      companyId,
      employeeId,
      planId,
      period,
      members: [
        {
          memberType: ItemRole.employee,
          memberId: employeeId,
          monthlyPrice,
          paymentAllocation,
        },
      ],
    };

    return this.createSubscription(config);
  }

  createFamilySubscription(
    companyId: string,
    employeeId: string,
    planId: string,
    familyConfig: {
      employeePrice: Money;
      spousePrice?: Money;
      childPrice?: Money;
      spouseId?: string;
      childrenIds?: string[];
      companyContributionPercentage?: number;
    },
  ): Subscription {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + 1);

    const period = new SubscriptionPeriod(startDate, endDate);

    const companyPercentage =
      familyConfig.companyContributionPercentage ||
      this.businessRules.companyContributionPercentage ||
      75;
    const members: SubscriptionMemberConfig[] = [];

    members.push({
      memberType: ItemRole.employee,
      memberId: employeeId,
      monthlyPrice: familyConfig.employeePrice,
      paymentAllocation: PaymentAllocation.fromPercentage(
        familyConfig.employeePrice,
        companyPercentage,
      ),
    });

    if (familyConfig.spouseId && familyConfig.spousePrice) {
      members.push({
        memberType: ItemRole.spouse,
        memberId: familyConfig.spouseId,
        monthlyPrice: familyConfig.spousePrice,
        paymentAllocation: PaymentAllocation.fromPercentage(
          familyConfig.spousePrice,
          companyPercentage,
        ),
      });
    }

    if (familyConfig.childrenIds && familyConfig.childPrice) {
      familyConfig.childrenIds.forEach((childId) => {
        members.push({
          memberType: ItemRole.child,
          memberId: childId,
          monthlyPrice: familyConfig.childPrice!,
          paymentAllocation: PaymentAllocation.fromPercentage(
            familyConfig.childPrice!,
            companyPercentage,
          ),
        });
      });
    }

    const config: SubscriptionConfig = {
      companyId,
      employeeId,
      planId,
      period,
      members,
    };

    return this.createSubscription(config);
  }

  private sortMembersByPriority(
    members: SubscriptionMemberConfig[],
  ): SubscriptionMemberConfig[] {
    const priority = {
      [ItemRole.employee]: 1,
      [ItemRole.spouse]: 2,
      [ItemRole.child]: 3,
    };

    return [...members].sort(
      (a, b) => priority[a.memberType] - priority[b.memberType],
    );
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
