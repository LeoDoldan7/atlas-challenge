import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Employee } from '../../employee/types/employee.type';
import { HealthcareSubscription } from '../../healthcare-subscription/types/healthcare-subscription.type';

@ObjectType()
export class Company {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  countryIsoCode: string;

  @Field()
  createdAt: Date;

  @Field(() => [Employee], { nullable: true })
  employees?: Employee[];

  @Field(() => [HealthcareSubscription], { nullable: true })
  subscriptions?: HealthcareSubscription[];
}
