import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SubscriptionStatus,
  SubscriptionStepType,
  StepStatus,
} from '@prisma/client';

@Injectable()
export class PlanActivationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSubscriptionForActivation(subscriptionId: string) {
    return this.prisma.healthcareSubscription.findUnique({
      where: { id: BigInt(subscriptionId) },
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
  }

  async activateSubscription(subscriptionId: bigint, endDate?: Date) {
    return this.prisma.$transaction(async (tx) => {
      // Mark the plan activation step as completed
      await tx.subscriptionStep.updateMany({
        where: {
          healthcare_subscription_id: subscriptionId,
          type: SubscriptionStepType.PLAN_ACTIVATION,
        },
        data: {
          status: StepStatus.COMPLETED,
          completed_at: new Date(),
        },
      });

      // Check if all steps are completed
      const allSteps = await tx.subscriptionStep.findMany({
        where: {
          healthcare_subscription_id: subscriptionId,
        },
      });

      const allCompleted = allSteps.every(
        (step) => step.status === StepStatus.COMPLETED,
      );

      // Update subscription status to ACTIVE only if all steps are completed
      const newStatus = allCompleted
        ? SubscriptionStatus.ACTIVE
        : SubscriptionStatus.PENDING;

      return tx.healthcareSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: newStatus,
          end_date: endDate,
        },
      });
    });
  }
}
