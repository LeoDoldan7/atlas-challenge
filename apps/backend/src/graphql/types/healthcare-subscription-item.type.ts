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

  @Field(() => ID, { nullable: true })
  demographicId?: string;

  @Field()
  createdAt: Date;

  @Field(() => HealthcareSubscription, { nullable: true })
  subscription?: HealthcareSubscription;

  @Field(() => Demographic, { nullable: true })
  demographic?: Demographic;
}
