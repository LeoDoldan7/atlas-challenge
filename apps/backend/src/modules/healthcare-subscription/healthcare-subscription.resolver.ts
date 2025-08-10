import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { HealthcareSubscription } from '../../graphql/healthcare-subscription/types/healthcare-subscription.type';
import { HealthcareSubscriptionService } from './healthcare-subscription.service';
import { CreateSubscriptionInput } from './dtos/create-subscription.input';
import { UploadFamilyDemographicsInput } from './dtos/upload-family-demographics.input';
import { UploadFilesInput } from './dtos/upload-files.input';
import { ActivatePlanInput } from './dtos/activate-plan.input';

@Resolver()
export class HealthcareSubscriptionResolver {
  constructor(private readonly service: HealthcareSubscriptionService) {}

  @Query(() => [HealthcareSubscription], {
    name: 'getSubscriptions',
    description:
      'Get healthcare subscriptions, optionally filtered by employee ID',
  })
  async getSubscriptions(
    @Args('employeeId', { nullable: true }) employeeId?: string,
  ): Promise<HealthcareSubscription[]> {
    return this.service.getSubscriptions(employeeId);
  }

  @Query(() => HealthcareSubscription, {
    name: 'getSubscriptionStatus',
    description: 'Get subscription details and enrollment progress',
  })
  async getSubscriptionStatus(
    @Args('subscriptionId') subscriptionId: string,
  ): Promise<HealthcareSubscription> {
    return this.service.getSubscriptionStatus(subscriptionId);
  }

  @Mutation(() => HealthcareSubscription)
  async createSubscription(
    @Args('createSubscriptionInput') input: CreateSubscriptionInput,
  ): Promise<HealthcareSubscription> {
    return this.service.createSubscription(input);
  }

  @Mutation(() => HealthcareSubscription)
  async uploadFamilyDemographics(
    @Args('uploadFamilyDemographicsInput') input: UploadFamilyDemographicsInput,
  ): Promise<HealthcareSubscription> {
    return this.service.uploadFamilyDemographics(input);
  }

  @Mutation(() => HealthcareSubscription)
  async uploadFiles(
    @Args('uploadFilesInput') input: UploadFilesInput,
  ): Promise<HealthcareSubscription> {
    return this.service.uploadFiles(input);
  }

  @Mutation(() => HealthcareSubscription)
  async activatePlan(
    @Args('activatePlanInput') input: ActivatePlanInput,
  ): Promise<HealthcareSubscription> {
    return this.service.activatePlan(input);
  }
}
