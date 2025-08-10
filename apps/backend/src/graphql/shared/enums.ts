import { registerEnumType } from '@nestjs/graphql';

export enum SubscriptionType {
  INDIVIDUAL = 'individual',
  FAMILY = 'family',
}

export enum SubscriptionStatus {
  DEMOGRAPHIC_VERIFICATION_PENDING = 'demographic_verification_pending',
  DOCUMENT_UPLOAD_PENDING = 'document_upload_pending',
  PLAN_ACTIVATION_PENDING = 'plan_activation_pending',
  ACTIVE = 'active',
  CANCELED = 'canceled',
  TERMINATED = 'terminated',
}

export enum ItemRole {
  EMPLOYEE = 'employee',
  SPOUSE = 'spouse',
  CHILD = 'child',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  SEPARATED = 'separated',
}

// Register enums with GraphQL
registerEnumType(SubscriptionType, {
  name: 'SubscriptionType',
  description: 'Healthcare subscription type',
});

registerEnumType(SubscriptionStatus, {
  name: 'SubscriptionStatus',
  description: 'Healthcare subscription status',
});

registerEnumType(ItemRole, {
  name: 'ItemRole',
  description: 'Role of person in healthcare subscription',
});

registerEnumType(MaritalStatus, {
  name: 'MaritalStatus',
  description: 'Marital status of employee',
});
