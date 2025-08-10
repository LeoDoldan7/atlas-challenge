import { Field, InputType } from '@nestjs/graphql';
import { ItemRole } from '../../shared/enums';

@InputType()
export class DemographicInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  governmentId: string;

  @Field()
  birthDate: Date;
}

@InputType()
export class FamilyMemberInput {
  @Field(() => ItemRole)
  role: ItemRole;

  @Field(() => DemographicInput)
  demographic: DemographicInput;
}

@InputType()
export class UploadFamilyDemographicsInput {
  @Field()
  subscriptionId: string;

  @Field(() => [FamilyMemberInput])
  familyMembers: FamilyMemberInput[];
}
