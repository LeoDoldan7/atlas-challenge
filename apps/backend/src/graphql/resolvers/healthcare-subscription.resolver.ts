import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { HealthcareSubscription, SubscriptionStatus } from '../types';
import { CreateSubscriptionInput } from '../dto/create-subscription.input';
import { getHealthcareSubscriptionType } from 'src/utils/healthcare-subscription.utils';

@Resolver()
export class HealthcareSubscriptionResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Mutation(() => HealthcareSubscription)
  async createSubscription(
    @Args('createSubscriptionInput')
    createSubscriptionInput: CreateSubscriptionInput,
  ) {
    const subscription = await this.prisma.healthcareSubscription.create({
      data: {
        employee_id: BigInt(createSubscriptionInput.employeeId),
        billing_anchor: new Date().getDate(),
        company_id: 1,
        plan_id: createSubscriptionInput.planId,
        start_date: new Date(),
        status: SubscriptionStatus.DEMOGRAPHIC_VERIFICATION_PENDING,
        type: getHealthcareSubscriptionType(
          createSubscriptionInput.includeSpouse,
          createSubscriptionInput.numOfChildren,
        ),
      },
    });
    return {
      id: subscription.id.toString(),
      companyId: subscription.company_id.toString(),
      employeeId: subscription.employee_id.toString(),
      type: subscription.type,
      status: subscription.status,
      planId: subscription.plan_id.toString(),
      startDate: subscription.start_date,
      endDate: subscription.end_date,
      billingAnchor: subscription.billing_anchor,
      createdAt: subscription.created_at,
    };
  }
}
