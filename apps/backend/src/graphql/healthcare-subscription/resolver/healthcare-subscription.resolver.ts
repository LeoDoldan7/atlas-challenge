import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { HealthcareSubscription } from '../types/healthcare-subscription.type';
import { CreateSubscriptionInput } from '../dto/create-subscription.input';
import { UploadFamilyDemographicsInput } from '../dto/upload-family-demographics.input';
import { UploadFilesInput } from '../dto/upload-files.input';
import { ActivatePlanInput } from '../dto/activate-plan.input';
import { HealthcareSubscriptionService } from '../../../modules/healthcare-subscription/healthcare-subscription.service';

@Resolver()
export class HealthcareSubscriptionResolver {
  constructor(
    private readonly healthcareSubscriptionService: HealthcareSubscriptionService,
  ) {}

  @Query(() => [HealthcareSubscription], {
    name: 'getSubscriptions',
    description: 'Get all healthcare subscriptions',
  })
  async getSubscriptions() {
    return this.healthcareSubscriptionService.getAllSubscriptions();
  }

  @Mutation(() => HealthcareSubscription)
  async createSubscription(
    @Args('createSubscriptionInput')
    createSubscriptionInput: CreateSubscriptionInput,
  ) {
    return this.healthcareSubscriptionService.createSubscription(
      createSubscriptionInput,
    );
  }

  @Mutation(() => HealthcareSubscription)
  async uploadFamilyDemographics(
    @Args('uploadFamilyDemographicsInput')
    uploadFamilyDemographicsInput: UploadFamilyDemographicsInput,
  ) {
    return this.healthcareSubscriptionService.uploadFamilyDemographics(
      uploadFamilyDemographicsInput,
    );
  }

  @Mutation(() => HealthcareSubscription)
  async uploadFiles(
    @Args('uploadFilesInput')
    uploadFilesInput: UploadFilesInput,
  ) {
    return this.healthcareSubscriptionService.uploadFiles(uploadFilesInput);
  }

  @Mutation(() => HealthcareSubscription)
  async activatePlan(
    @Args('activatePlanInput')
    activatePlanInput: ActivatePlanInput,
  ) {
    return this.healthcareSubscriptionService.activatePlan(activatePlanInput);
  }
}
