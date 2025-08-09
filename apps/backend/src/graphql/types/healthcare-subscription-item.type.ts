import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ItemRole } from './enums';
import { HealthcareSubscription } from './healthcare-subscription.type';
import { Demographic } from './demographic.type';

@ObjectType()
export class HealthcareSubscriptionItem {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  healthcareSubscriptionId: string;

  @Field(() => ItemRole)
  role: ItemRole;

  @Field(() => ID)
  demographicId: string;

  @Field()
  createdAt: Date;

  @Field(() => HealthcareSubscription)
  subscription: HealthcareSubscription;

  @Field(() => Demographic)
  demographic: Demographic;
}
