import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivatePlanInput } from '../graphql/dto/activate-plan.input';
import { SubscriptionStatus } from '../graphql/types/enums';

@Injectable()
export class PlanActivationService {
  constructor(private readonly prisma: PrismaService) {}

  async activatePlan(input: ActivatePlanInput) {
    // Validate subscription exists and is in correct status
    const subscription = await this.prisma.healthcareSubscription.findUnique({
      where: { id: BigInt(input.subscriptionId) },
      include: {
        items: true,
        files: true,
        employee: {
          include: {
            demographics: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new Error('Healthcare subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.PLAN_ACTIVATION_PENDING) {
      throw new Error('Subscription is not in plan activation pending status');
    }

    // Validate that all required items have demographics
    const itemsWithoutDemographics = subscription.items.filter(
      (item) => !item.demographic_id,
    );

    if (itemsWithoutDemographics.length > 0) {
      throw new Error(
        'All family members must have demographic information before activation',
      );
    }

    // Validate that documents have been uploaded
    if (subscription.files.length === 0) {
      throw new Error(
        'At least one document must be uploaded before activation',
      );
    }

    // Activate the plan
    const activatedSubscription =
      await this.prisma.healthcareSubscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          // Set end date to one year from start date as default
          end_date:
            subscription.end_date ||
            new Date(
              new Date(subscription.start_date).setFullYear(
                new Date(subscription.start_date).getFullYear() + 1,
              ),
            ),
        },
      });

    return {
      subscription: activatedSubscription,
      message: 'Healthcare plan has been successfully activated',
    };
  }
}
