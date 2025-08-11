import { ObjectType, Field, ID } from '@nestjs/graphql';
import { HealthcareSubscription } from '../../healthcare-subscription/types/healthcare-subscription.type';

@ObjectType()
export class HealthcarePlan {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  costEmployeeCents: string;

  @Field()
  pctEmployeePaidByCompany: string;

  @Field()
  costSpouseCents: string;

  @Field()
  pctSpousePaidByCompany: string;

  @Field()
  costChildCents: string;

  @Field()
  pctChildPaidByCompany: string;

  @Field(() => [HealthcareSubscription], { nullable: true })
  subscriptions?: HealthcareSubscription[];
}
