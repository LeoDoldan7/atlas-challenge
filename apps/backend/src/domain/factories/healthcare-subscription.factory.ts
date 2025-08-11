import {
  SubscriptionFactory,
  SubscriptionConfig,
  SubscriptionTemplate,
  ValidationResult,
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
    const validation = this.validateConfiguration(config);
    if (!validation.isValid) {
      throw new Error(
        `Invalid subscription configuration: ${validation.errors.join(', ')}`,
      );
    }

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

  createFromTemplate(
    template: SubscriptionTemplate,
    config: Omit<SubscriptionConfig, 'members'>,
  ): Subscription {
    const members: SubscriptionMemberConfig[] = template.defaultMembers.map(
      (memberTemplate, index) => ({
        ...memberTemplate,
        memberId: this.generateMemberId(memberTemplate.memberType, index),
      }),
    );

    const fullConfig: SubscriptionConfig = {
      ...config,
      members,
    };

    this.businessRules = { ...this.businessRules, ...template.businessRules };

    return this.createSubscription(fullConfig);
  }

  validateConfiguration(config: SubscriptionConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.companyId) errors.push('Company ID is required');
    if (!config.employeeId) errors.push('Employee ID is required');
    if (!config.planId) errors.push('Plan ID is required');
    if (!config.period) errors.push('Subscription period is required');

    if (config.members) {
      const memberValidation = this.validateMembers(config.members);
      errors.push(...memberValidation.errors);
      warnings.push(...memberValidation.warnings);
    }

    const paymentValidation = this.validatePaymentConfiguration(config);
    errors.push(...paymentValidation.errors);
    warnings.push(...paymentValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
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

  private validateMembers(
    members: SubscriptionMemberConfig[],
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const employeeCount = members.filter(
      (m) => m.memberType === ItemRole.employee,
    ).length;
    const spouseCount = members.filter(
      (m) => m.memberType === ItemRole.spouse,
    ).length;
    const childrenCount = members.filter(
      (m) => m.memberType === ItemRole.child,
    ).length;

    if (employeeCount === 0) {
      errors.push('At least one employee must be included');
    }

    if (employeeCount > 1) {
      errors.push('Only one employee allowed per subscription');
    }

    if (spouseCount > 1) {
      errors.push('Only one spouse allowed per subscription');
    }

    if (
      this.businessRules.maxChildren &&
      childrenCount > this.businessRules.maxChildren
    ) {
      errors.push(`Maximum ${this.businessRules.maxChildren} children allowed`);
    }

    if (
      this.businessRules.requiresSpouseForChildren &&
      childrenCount > 0 &&
      spouseCount === 0
    ) {
      errors.push('Spouse is required when adding children');
    }

    const memberIds = members.map((m) => m.memberId);
    const uniqueIds = new Set(memberIds);
    if (memberIds.length !== uniqueIds.size) {
      errors.push('Duplicate member IDs found');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validatePaymentConfiguration(
    config: SubscriptionConfig,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.members) {
      for (const member of config.members) {
        if (
          !this.businessRules.allowedPaymentSources?.includes(
            member.paymentAllocation.source,
          )
        ) {
          errors.push(
            `Payment source ${member.paymentAllocation.source} not allowed for member ${member.memberId}`,
          );
        }

        if (member.monthlyPrice.amount <= 0) {
          errors.push(
            `Monthly price must be positive for member ${member.memberId}`,
          );
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
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

  private generateMemberId(memberType: ItemRole, index: number): string {
    return `${memberType.toLowerCase()}_${Date.now()}_${index}`;
  }
}
