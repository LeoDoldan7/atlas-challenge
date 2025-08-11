import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Prisma,
  SubscriptionStepType,
  StepStatus,
  SubscriptionStatus,
  ItemRole,
} from '@prisma/client';

const subscriptionWithRelationsInclude = {
  items: true,
  files: true,
  steps: true,
  employee: {
    include: {
      demographics: true,
      wallet: true,
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

  async findByEmployeeId(
    employeeId: string,
  ): Promise<HealthcareSubscriptionWithRelations[]> {
    return this.prisma.healthcareSubscription.findMany({
      where: { employee_id: BigInt(employeeId) },
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
      include: {
        wallet: true,
        demographics: true,
      },
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
      const subscription = await tx.healthcareSubscription.create({
        data: subscriptionData,
      });

      await tx.healthcareSubscriptionItem.createMany({
        data: items.map((item) => ({
          ...item,
          healthcare_subscription_id: subscription.id,
        })),
      });

      await tx.subscriptionStep.createMany({
        data: [
          {
            healthcare_subscription_id: subscription.id,
            type: 'DEMOGRAPHIC_VERIFICATION',
            status: 'PENDING',
          },
          {
            healthcare_subscription_id: subscription.id,
            type: 'DOCUMENT_UPLOAD',
            status: 'PENDING',
          },
          {
            healthcare_subscription_id: subscription.id,
            type: 'PLAN_ACTIVATION',
            status: 'PENDING',
          },
        ],
      });

      return tx.healthcareSubscription.findUnique({
        where: { id: subscription.id },
        include: subscriptionWithRelationsInclude,
      }) as Promise<HealthcareSubscriptionWithRelations>;
    });
  }

  async updateStepStatus(
    subscriptionId: string,
    stepType: SubscriptionStepType,
    status: StepStatus,
  ): Promise<void> {
    await this.prisma.subscriptionStep.updateMany({
      where: {
        healthcare_subscription_id: BigInt(subscriptionId),
        type: stepType,
      },
      data: {
        status,
        completed_at: status === StepStatus.COMPLETED ? new Date() : null,
      },
    });
  }

  async checkAllStepsCompleted(subscriptionId: string): Promise<boolean> {
    const steps = await this.prisma.subscriptionStep.findMany({
      where: {
        healthcare_subscription_id: BigInt(subscriptionId),
      },
    });

    return steps.every((step) => step.status === 'COMPLETED');
  }

  async findPlanById(planId: string) {
    return this.prisma.healthcarePlan.findUnique({
      where: { id: BigInt(planId) },
    });
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
  ): Promise<HealthcareSubscriptionWithRelations> {
    return this.prisma.healthcareSubscription.update({
      where: { id: BigInt(subscriptionId) },
      data: { status },
      include: subscriptionWithRelationsInclude,
    });
  }

  async createDemographic(
    demographicData: {
      first_name: string;
      last_name: string;
      government_id: string;
      birth_date: Date;
    },
    subscriptionId: string,
    role: ItemRole,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const demographic = await tx.demographic.create({
        data: demographicData,
      });

      await tx.healthcareSubscriptionItem.updateMany({
        where: {
          healthcare_subscription_id: BigInt(subscriptionId),
          role,
          demographic_id: null,
        },
        data: {
          demographic_id: demographic.id,
        },
      });

      return demographic;
    });
  }

  async createSubscriptionFile(
    fileData: Prisma.HealthcareSubscriptionFileCreateInput,
  ) {
    return this.prisma.healthcareSubscriptionFile.create({
      data: fileData,
    });
  }
}
