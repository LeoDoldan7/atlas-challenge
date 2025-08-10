import { ObjectType, Field, ID } from '@nestjs/graphql';
import { HealthcareSubscriptionItem } from './healthcare-subscription-item.type';

@ObjectType()
export class Demographic {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  governmentId: string;

  @Field()
  birthDate: Date;

  @Field()
  createdAt: Date;

  @Field(() => [HealthcareSubscriptionItem], { nullable: true })
  subItems?: HealthcareSubscriptionItem[];
}
