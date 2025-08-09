import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Employee } from './employee.type';
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

  @Field(() => [Employee], { nullable: true })
  employees?: Employee[];

  @Field(() => [HealthcareSubscriptionItem], { nullable: true })
  subItems?: HealthcareSubscriptionItem[];
}
