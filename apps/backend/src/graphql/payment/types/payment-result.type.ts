import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class EmployeePaymentResult {
  @Field()
  employeeId: string;

  @Field()
  success: boolean;

  @Field({ nullable: true })
  amountPaid?: string;

  @Field({ nullable: true })
  subscriptionsPaid?: number;

  @Field({ nullable: true })
  error?: string;

  @Field({ nullable: true })
  partialSuccess?: boolean;
}

@ObjectType()
export class PaymentResult {
  @Field()
  overallSuccess: boolean;

  @Field()
  totalAmountProcessed: string;

  @Field()
  totalSuccessfulPayments: number;

  @Field()
  totalFailedPayments: number;

  @Field()
  totalPartialFailures: number;

  @Field(() => [EmployeePaymentResult])
  employeeResults: EmployeePaymentResult[];
}
