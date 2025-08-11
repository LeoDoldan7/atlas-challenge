import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class EmployeePaymentResult {
  @Field()
  employeeId: string;

  @Field()
  amountPaid: string;

  @Field()
  subscriptionsPaid: number;
}

@ObjectType()
export class PaymentResult {
  @Field()
  success: boolean;

  @Field()
  totalAmountProcessed: string;

  @Field(() => [EmployeePaymentResult])
  employeePayments: EmployeePaymentResult[];
}
