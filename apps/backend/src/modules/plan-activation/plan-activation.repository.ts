import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionStatus } from '../../graphql/shared/enums';

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
    return this.prisma.healthcareSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        end_date: endDate,
      },
    });
  }
}
