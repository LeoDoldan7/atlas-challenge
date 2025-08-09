import { ObjectType, Field, ID } from '@nestjs/graphql';
import { HealthcareSubscription } from './healthcare-subscription.type';

@ObjectType()
export class HealthcareSubscriptionFile {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  healthcareSubscriptionId: string;

  @Field()
  path: string;

  @Field()
  originalName: string;

  @Field()
  fileSizeBytes: number;

  @Field()
  mimeType: string;

  @Field()
  createdAt: Date;

  @Field(() => HealthcareSubscription)
  subscription: HealthcareSubscription;
}
