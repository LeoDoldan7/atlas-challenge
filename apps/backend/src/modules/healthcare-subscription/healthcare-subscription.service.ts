import { Injectable } from '@nestjs/common';
import { HealthcareSubscriptionRepository } from './healthcare-subscription.repository';
import { HealthcareSubscriptionMapper } from './healthcare-subscription.mapper';
import { HealthcareSubscription } from '../../graphql/types/healthcare-subscription.type';
import { FamilyDemographicsService } from '../family-demographics/family-demographics.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { PlanActivationService } from '../plan-activation/plan-activation.service';
import { CreateSubscriptionInput } from './dtos/create-subscription.input';
import { UploadFamilyDemographicsInput } from './dtos/upload-family-demographics.input';
import { UploadFilesInput } from './dtos/upload-files.input';
import { ActivatePlanInput } from './dtos/activate-plan.input';
import { SubscriptionStatus } from '../../graphql/types/enums';
import { getHealthcareSubscriptionType } from '../../utils/healthcare-subscription.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class HealthcareSubscriptionService {
  constructor(
    private readonly repository: HealthcareSubscriptionRepository,
    private readonly mapper: HealthcareSubscriptionMapper,
    private readonly familyDemographicsService: FamilyDemographicsService,
    private readonly fileUploadService: FileUploadService,
    private readonly planActivationService: PlanActivationService,
  ) {}

  async getAllSubscriptions(): Promise<HealthcareSubscription[]> {
    const subscriptions = await this.repository.findAllWithRelations();
    return subscriptions.map((subscription) =>
      this.mapper.toGraphQL(subscription),
    );
  }

  async createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<HealthcareSubscription> {
    // First, get the employee to access their demographic ID
    const employee = await this.repository.findEmployeeById(
      input.employeeId.toString(),
    );

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Prepare subscription data
    const subscriptionData: Prisma.HealthcareSubscriptionCreateInput = {
      employee: { connect: { id: BigInt(input.employeeId) } },
      company: { connect: { id: BigInt(1) } }, // TODO: Get from auth context
      plan: { connect: { id: BigInt(input.planId) } },
      billing_anchor: new Date().getDate(),
      start_date: new Date(),
      status: SubscriptionStatus.DEMOGRAPHIC_VERIFICATION_PENDING,
      type: getHealthcareSubscriptionType(
        input.includeSpouse,
        input.numOfChildren,
      ),
    };

    // Create subscription items for family members
    const itemsToCreate: Omit<
      Prisma.HealthcareSubscriptionItemCreateManyInput,
      'healthcare_subscription_id'
    >[] = [];

    // 1. Always create an employee item linking to their existing demographic
    itemsToCreate.push({
      role: 'employee',
      demographic_id: employee.demographics_id,
    });

    // 2. Create spouse item if family subscription includes spouse
    if (input.includeSpouse) {
      itemsToCreate.push({
        role: 'spouse',
      });
    }

    // 3. Create children items based on numOfChildren
    for (let i = 0; i < input.numOfChildren; i++) {
      itemsToCreate.push({
        role: 'child',
      });
    }

    // Create subscription with items using repository
    const createdSubscription =
      await this.repository.createSubscriptionWithItems(
        subscriptionData,
        itemsToCreate,
      );

    return this.mapper.toGraphQL(createdSubscription);
  }

  async uploadFamilyDemographics(
    input: UploadFamilyDemographicsInput,
  ): Promise<HealthcareSubscription> {
    const result =
      await this.familyDemographicsService.uploadFamilyDemographics(input);
    // Get the updated subscription with full relations
    const updatedSubscription = await this.repository.findByIdWithRelations(
      result.subscription.id.toString(),
    );
    if (!updatedSubscription) {
      throw new Error('Updated subscription not found');
    }
    return this.mapper.toGraphQL(updatedSubscription);
  }

  async uploadFiles(input: UploadFilesInput): Promise<HealthcareSubscription> {
    const result = await this.fileUploadService.uploadFiles(input);
    // Get the updated subscription with full relations
    const updatedSubscription = await this.repository.findByIdWithRelations(
      result.subscription.id.toString(),
    );
    if (!updatedSubscription) {
      throw new Error('Updated subscription not found');
    }
    return this.mapper.toGraphQL(updatedSubscription);
  }

  async activatePlan(
    input: ActivatePlanInput,
  ): Promise<HealthcareSubscription> {
    const result = await this.planActivationService.activatePlan(input);
    // Get the updated subscription with full relations
    const updatedSubscription = await this.repository.findByIdWithRelations(
      result.subscription.id.toString(),
    );
    if (!updatedSubscription) {
      throw new Error('Updated subscription not found');
    }
    return this.mapper.toGraphQL(updatedSubscription);
  }
}
