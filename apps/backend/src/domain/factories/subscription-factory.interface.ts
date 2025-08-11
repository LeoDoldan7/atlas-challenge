import { Subscription } from '../aggregates/subscription.aggregate';
import { SubscriptionPeriod } from '../value-objects/subscription-period.value-object';
import { PaymentAllocation } from '../value-objects/payment-allocation.value-object';
import { Money } from '../value-objects/money.value-object';
import { ItemRole } from '@prisma/client';

export interface SubscriptionMemberConfig {
  memberType: ItemRole;
  memberId: string;
  monthlyPrice: Money;
  paymentAllocation: PaymentAllocation;
}

export interface SubscriptionConfig {
  companyId: string;
  employeeId: string;
  planId: string;
  period: SubscriptionPeriod;
  members?: SubscriptionMemberConfig[];
  metadata?: Record<string, any>;
}

export interface SubscriptionTemplate {
  name: string;
  description: string;
  defaultMembers: Omit<SubscriptionMemberConfig, 'memberId'>[];
  businessRules: SubscriptionBusinessRules;
}

export interface SubscriptionBusinessRules {
  requiresSpouseForChildren?: boolean;
  maxChildren?: number;
  minimumAge?: Record<ItemRole, number>;
  allowedPaymentSources?: string[];
  companyContributionPercentage?: number;
}

export interface SubscriptionFactory {
  createSubscription(config: SubscriptionConfig): Subscription;
  createFromTemplate(
    template: SubscriptionTemplate,
    config: Omit<SubscriptionConfig, 'members'>,
  ): Subscription;
  validateConfiguration(config: SubscriptionConfig): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
