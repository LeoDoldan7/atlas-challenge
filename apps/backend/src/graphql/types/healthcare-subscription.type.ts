import { ObjectType, Field, ID } from '@nestjs/graphql';
import { SubscriptionType, SubscriptionStatus } from './enums';
import { Company } from './company.type';
import { Employee } from './employee.type';
import { HealthcarePlan } from './healthcare-plan.type';
import { HealthcareSubscriptionItem } from './healthcare-subscription-item.type';
import { HealthcareSubscriptionFile } from './healthcare-subscription-file.type';

@ObjectType()
export class HealthcareSubscription {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  companyId: string;

  @Field(() => ID)
  employeeId: string;

  @Field(() => SubscriptionType)
  type: SubscriptionType;

  @Field(() => SubscriptionStatus)
  status: SubscriptionStatus;

  @Field(() => ID)
  planId: string;

  @Field()
  startDate: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field()
  billingAnchor: number;

  @Field()
  createdAt: Date;

  @Field(() => Company, { nullable: true })
  company?: Company;

  @Field(() => Employee, { nullable: true })
  employee?: Employee;

  @Field(() => HealthcarePlan, { nullable: true })
  plan?: HealthcarePlan;

  @Field(() => [HealthcareSubscriptionItem], { nullable: true })
  items?: HealthcareSubscriptionItem[];

  @Field(() => [HealthcareSubscriptionFile], { nullable: true })
  files?: HealthcareSubscriptionFile[];
}
