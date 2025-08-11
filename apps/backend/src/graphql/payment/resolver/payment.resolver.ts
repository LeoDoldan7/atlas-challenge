import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { PaymentService } from '../../../modules/payment/payment.service';
import { PaymentResult } from '../types/payment-result.type';
import { ProcessPaymentsInput } from '../dto/process-payments.input';

@Resolver()
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(() => PaymentResult)
  async processCompanyPayments(
    @Args('processPaymentsInput') input: ProcessPaymentsInput,
  ): Promise<PaymentResult> {
    return this.paymentService.processCompanySubscriptionPayments(
      input.companyId,
    );
  }
}
