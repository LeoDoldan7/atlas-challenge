import { Injectable } from '@nestjs/common';
import { PlanActivationRepository } from './plan-activation.repository';
import { ActivatePlanInput } from '../healthcare-subscription/dtos/activate-plan.input';
import { SubscriptionStatus } from '../../graphql/types/enums';

@Injectable()
export class PlanActivationService {
  constructor(private readonly repository: PlanActivationRepository) {}

  async activatePlan(input: ActivatePlanInput) {
    // Validate subscription exists and is in correct status
    const subscription = await this.repository.findSubscriptionForActivation(
      input.subscriptionId,
    );

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

    // Calculate end date - one year from start date as default
    const endDate =
      subscription.end_date ||
      new Date(
        new Date(subscription.start_date).setFullYear(
          new Date(subscription.start_date).getFullYear() + 1,
        ),
      );

    // Activate the plan
    const activatedSubscription = await this.repository.activateSubscription(
      subscription.id,
      endDate,
    );

    return {
      subscription: activatedSubscription,
      message: 'Healthcare plan has been successfully activated',
    };
  }
}
