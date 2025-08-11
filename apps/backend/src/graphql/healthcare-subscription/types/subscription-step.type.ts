import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum SubscriptionStepType {
  DEMOGRAPHIC_VERIFICATION = 'DEMOGRAPHIC_VERIFICATION',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  PLAN_ACTIVATION = 'PLAN_ACTIVATION',
}

export enum StepStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

registerEnumType(SubscriptionStepType, {
  name: 'SubscriptionStepType',
  description: 'The type of subscription step',
});

registerEnumType(StepStatus, {
  name: 'StepStatus',
  description: 'The status of a subscription step',
});

@ObjectType()
export class SubscriptionStep {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  healthcareSubscriptionId: string;

  @Field(() => SubscriptionStepType)
  type: SubscriptionStepType;

  @Field(() => StepStatus)
  status: StepStatus;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  completedAt?: Date;
}
