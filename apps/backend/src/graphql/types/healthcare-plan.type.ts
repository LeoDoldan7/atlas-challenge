import { ObjectType, Field, ID } from '@nestjs/graphql';
import { HealthcareSubscription } from './healthcare-subscription.type';

@ObjectType()
export class HealthcarePlan {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  costEmployeeCents: string; // BigInt as string

  @Field()
  pctEmployeePaidByCompany: string; // Decimal as string

  @Field()
  costSpouseCents: string; // BigInt as string

  @Field()
  pctSpousePaidByCompany: string; // Decimal as string

  @Field()
  costChildCents: string; // BigInt as string

  @Field()
  pctChildPaidByCompany: string; // Decimal as string

  @Field(() => [HealthcareSubscription], { nullable: true })
  subscriptions?: HealthcareSubscription[];
}
