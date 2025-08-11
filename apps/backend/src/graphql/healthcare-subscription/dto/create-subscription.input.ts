import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class MemberTypePercentages {
  @Field({ description: 'Percentage company pays (0-100)' })
  companyPercent: number;

  @Field({ description: 'Percentage employee pays (0-100)' })
  employeePercent: number;
}

@InputType()
export class CreateSubscriptionInput {
  @Field()
  employeeId: number;

  @Field()
  planId: number;

  @Field()
  includeSpouse: boolean;

  @Field()
  numOfChildren: number;

  @Field(() => MemberTypePercentages, {
    nullable: true,
    description: 'Custom percentages for employee coverage',
  })
  employeePercentages?: MemberTypePercentages;

  @Field(() => MemberTypePercentages, {
    nullable: true,
    description: 'Custom percentages for spouse coverage',
  })
  spousePercentages?: MemberTypePercentages;

  @Field(() => MemberTypePercentages, {
    nullable: true,
    description: 'Custom percentages for children coverage',
  })
  childPercentages?: MemberTypePercentages;
}
