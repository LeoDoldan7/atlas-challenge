import { SubscriptionType } from '@prisma/client';

export function getHealthcareSubscriptionType(
  spouseIncluded: boolean,
  numOfChildren: number,
): SubscriptionType {
  return spouseIncluded || numOfChildren > 0
    ? SubscriptionType.family
    : SubscriptionType.individual;
}
