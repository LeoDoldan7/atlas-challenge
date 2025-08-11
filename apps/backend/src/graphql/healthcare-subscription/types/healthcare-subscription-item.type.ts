import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ItemRole } from '../../shared/enums';
import { HealthcareSubscription } from './healthcare-subscription.type';
import { Demographic } from '../../demographic/types/demographic.type';

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

  @Field({
    nullable: true,
    description: 'Custom percentage company pays (0-100)',
  })
  companyPct?: number;

  @Field({
    nullable: true,
    description: 'Custom percentage employee pays (0-100)',
  })
  employeePct?: number;

  @Field()
  createdAt: Date;

  @Field(() => HealthcareSubscription, { nullable: true })
  subscription?: HealthcareSubscription;

  @Field(() => Demographic, { nullable: true })
  demographic?: Demographic;
}
