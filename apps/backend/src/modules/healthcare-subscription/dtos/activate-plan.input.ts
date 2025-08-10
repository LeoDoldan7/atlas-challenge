import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ActivatePlanInput {
  @Field()
  subscriptionId: string;
}
