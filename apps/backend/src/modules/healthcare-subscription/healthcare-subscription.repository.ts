import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const subscriptionWithRelationsInclude = {
  items: true,
  files: true,
  employee: {
    include: {
      demographics: true,
    },
  },
  plan: true,
} as const;

export type HealthcareSubscriptionWithRelations =
  Prisma.HealthcareSubscriptionGetPayload<{
    include: typeof subscriptionWithRelationsInclude;
  }>;

@Injectable()
export class HealthcareSubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllWithRelations(): Promise<HealthcareSubscriptionWithRelations[]> {
    return this.prisma.healthcareSubscription.findMany({
      include: subscriptionWithRelationsInclude,
    });
  }

  async findByIdWithRelations(
    id: string,
  ): Promise<HealthcareSubscriptionWithRelations | null> {
    return this.prisma.healthcareSubscription.findUnique({
      where: { id: BigInt(id) },
      include: subscriptionWithRelationsInclude,
    });
  }

  async create(
    data: Prisma.HealthcareSubscriptionCreateInput,
  ): Promise<HealthcareSubscriptionWithRelations> {
    return this.prisma.healthcareSubscription.create({
      data,
      include: subscriptionWithRelationsInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.HealthcareSubscriptionUpdateInput,
  ): Promise<HealthcareSubscriptionWithRelations> {
    return this.prisma.healthcareSubscription.update({
      where: { id: BigInt(id) },
      data,
      include: subscriptionWithRelationsInclude,
    });
  }

  async findEmployeeById(id: string) {
    return this.prisma.employee.findUnique({
      where: { id: BigInt(id) },
      select: { demographics_id: true },
    });
  }

  async createSubscriptionWithItems(
    subscriptionData: Prisma.HealthcareSubscriptionCreateInput,
    items: Omit<
      Prisma.HealthcareSubscriptionItemCreateManyInput,
      'healthcare_subscription_id'
    >[],
  ): Promise<HealthcareSubscriptionWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      // Create the subscription
      const subscription = await tx.healthcareSubscription.create({
        data: subscriptionData,
      });

      // Create subscription items
      await tx.healthcareSubscriptionItem.createMany({
        data: items.map((item) => ({
          ...item,
          healthcare_subscription_id: subscription.id,
        })),
      });

      // Return the subscription with full relations
      return tx.healthcareSubscription.findUnique({
        where: { id: subscription.id },
        include: subscriptionWithRelationsInclude,
      }) as Promise<HealthcareSubscriptionWithRelations>;
    });
  }
}
