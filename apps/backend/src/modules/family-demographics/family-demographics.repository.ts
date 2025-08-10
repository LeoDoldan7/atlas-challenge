import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HealthcareSubscriptionItem } from '@prisma/client';
import { SubscriptionStatus } from '../../graphql/shared/enums';

@Injectable()
export class FamilyDemographicsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSubscriptionWithItems(subscriptionId: string) {
    return this.prisma.healthcareSubscription.findUnique({
      where: { id: BigInt(subscriptionId) },
      include: { items: true },
    });
  }

  async findDemographicByGovernmentId(governmentId: string) {
    return this.prisma.demographic.findFirst({
      where: { government_id: governmentId },
    });
  }

  async createFamilyDemographicsTransaction(
    subscriptionId: bigint,
    familyMembers: Array<{
      role: string;
      demographic: {
        firstName: string;
        lastName: string;
        governmentId: string;
        birthDate: Date;
      };
    }>,
    subscriptionItems: Array<{
      id: bigint;
      role: string;
      demographic_id: bigint | null;
      healthcare_subscription_id: bigint;
      created_at: Date;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updatedItems: HealthcareSubscriptionItem[] = [];

      for (const member of familyMembers) {
        // Skip employee - they should already have demographics
        if (member.role === 'employee') {
          continue;
        }

        // Create demographic record
        const demographic = await tx.demographic.create({
          data: {
            first_name: member.demographic.firstName,
            last_name: member.demographic.lastName,
            government_id: member.demographic.governmentId,
            birth_date: member.demographic.birthDate,
          },
        });

        // Find the subscription item for this role and update with demographic ID
        const subscriptionItem = subscriptionItems.find(
          (item) => item.role === member.role && !item.demographic_id,
        );

        if (!subscriptionItem) {
          throw new Error(
            `No available subscription item found for role: ${member.role}`,
          );
        }

        const updatedItem = await tx.healthcareSubscriptionItem.update({
          where: { id: subscriptionItem.id },
          data: { demographic_id: demographic.id },
        });

        updatedItems.push(updatedItem);
      }

      // Update subscription status to next stage
      const subscription = await tx.healthcareSubscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.DOCUMENT_UPLOAD_PENDING },
      });

      return {
        subscription,
        updatedItems,
      };
    });
  }
}
