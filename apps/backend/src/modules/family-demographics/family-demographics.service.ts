import { Injectable } from '@nestjs/common';
import { FamilyDemographicsRepository } from './family-demographics.repository';
import {
  UploadFamilyDemographicsInput,
  FamilyMemberInput,
} from '../../graphql/healthcare-subscription/dto/upload-family-demographics.input';
import { ItemRole } from '../../graphql/shared/enums';
import { HealthcareSubscriptionItem } from '@prisma/client';

@Injectable()
export class FamilyDemographicsService {
  constructor(private readonly repository: FamilyDemographicsRepository) {}

  async uploadFamilyDemographics(input: UploadFamilyDemographicsInput) {
    return this.validateAndUploadFamilyDemographics(input);
  }

  async validateAndUploadFamilyDemographics(
    input: UploadFamilyDemographicsInput,
  ) {
    // Validate subscription exists and is in correct status
    const subscription = await this.repository.findSubscriptionWithItems(
      input.subscriptionId,
    );

    if (!subscription) {
      throw new Error('Healthcare subscription not found');
    }

    if (subscription.status !== 'PENDING') {
      throw new Error('Subscription is not in pending status');
    }

    // Validate family members data
    await this.validateFamilyMembers(input.familyMembers, subscription.items);

    // Create demographics and update subscription items in a transaction
    return await this.repository.createFamilyDemographicsTransaction(
      subscription.id,
      input.familyMembers,
      subscription.items,
    );
  }

  private async validateFamilyMembers(
    familyMembers: FamilyMemberInput[],
    existingItems: HealthcareSubscriptionItem[],
  ) {
    // Check for duplicate government IDs in input
    const governmentIds = familyMembers.map((m) => m.demographic.governmentId);
    const uniqueIds = new Set(governmentIds);
    if (uniqueIds.size !== governmentIds.length) {
      throw new Error('Duplicate government IDs found in family members');
    }

    // Check if government IDs already exist in database
    for (const member of familyMembers) {
      const existingDemo = await this.repository.findDemographicByGovernmentId(
        member.demographic.governmentId,
      );

      if (existingDemo) {
        throw new Error(
          `Government ID ${member.demographic.governmentId} already exists`,
        );
      }
    }

    // Validate roles match subscription items
    for (const member of familyMembers) {
      // Skip employee validation as they already have demographics
      if (member.role === ItemRole.EMPLOYEE) {
        continue;
      }

      const hasMatchingItem = existingItems.some(
        (item) => item.role === member.role && !item.demographic_id,
      );

      if (!hasMatchingItem) {
        throw new Error(
          `No matching subscription item found for role: ${member.role}`,
        );
      }
    }

    // Validate birth dates are reasonable
    const now = new Date();
    const oneHundredYearsAgo = new Date(
      now.getFullYear() - 100,
      now.getMonth(),
      now.getDate(),
    );

    for (const member of familyMembers) {
      const birthDate = new Date(member.demographic.birthDate);

      if (birthDate > now) {
        throw new Error(
          `Birth date cannot be in the future for ${member.demographic.firstName} ${member.demographic.lastName}`,
        );
      }

      if (birthDate < oneHundredYearsAgo) {
        throw new Error(
          `Birth date cannot be more than 100 years ago for ${member.demographic.firstName} ${member.demographic.lastName}`,
        );
      }

      // Additional validation for children (should be under 26 for typical insurance)
      if (member.role === ItemRole.CHILD) {
        const age = now.getFullYear() - birthDate.getFullYear();
        const monthDiff = now.getMonth() - birthDate.getMonth();
        const actualAge =
          monthDiff < 0 ||
          (monthDiff === 0 && now.getDate() < birthDate.getDate())
            ? age - 1
            : age;

        if (actualAge >= 26) {
          throw new Error(
            `Child ${member.demographic.firstName} ${member.demographic.lastName} must be under 26 years old`,
          );
        }
      }
    }

    // Validate required fields
    for (const member of familyMembers) {
      if (!member.demographic.firstName?.trim()) {
        throw new Error('First name is required for all family members');
      }
      if (!member.demographic.lastName?.trim()) {
        throw new Error('Last name is required for all family members');
      }
      if (!member.demographic.governmentId?.trim()) {
        throw new Error('Government ID is required for all family members');
      }
    }
  }
}
