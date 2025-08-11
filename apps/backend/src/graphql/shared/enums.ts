import { registerEnumType } from '@nestjs/graphql';

export enum SubscriptionType {
  INDIVIDUAL = 'individual',
  FAMILY = 'family',
}

export enum SubscriptionStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
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
