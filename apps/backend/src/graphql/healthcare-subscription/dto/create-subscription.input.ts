import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateSubscriptionInput {
  @Field()
  employeeId: number;

  @Field()
  planId: number;

  @Field()
  includeSpouse: boolean;

  @Field()
  numOfChildren: number;
}
