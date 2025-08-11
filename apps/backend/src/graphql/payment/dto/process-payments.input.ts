import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class ProcessPaymentsInput {
  @Field()
  companyId: string;
}