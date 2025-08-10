import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class EmployeeSpendingStatistics {
  @Field(() => ID)
  employeeId: string;

  @Field()
  employeeName: string;

  @Field(() => Float)
  totalMonthlyCostCents: number;

  @Field(() => Float)
  companyMonthlyCostCents: number;

  @Field(() => Float)
  employeeMonthlyCostCents: number;
}

@ObjectType()
export class PlanSpendingStatistics {
  @Field(() => ID)
  planId: string;

  @Field()
  planName: string;

  @Field()
  subscriptionCount: number;

  @Field(() => Float)
  totalMonthlyCostCents: number;

  @Field(() => Float)
  companyMonthlyCostCents: number;

  @Field(() => Float)
  employeeMonthlyCostCents: number;
}

@ObjectType()
export class CompanySpendingStatistics {
  @Field(() => ID)
  companyId: string;

  @Field()
  companyName: string;

  @Field(() => Float)
  totalMonthlyCostCents: number;

  @Field(() => Float)
  companyMonthlyCostCents: number;

  @Field(() => Float)
  employeeMonthlyCostCents: number;

  @Field(() => [EmployeeSpendingStatistics])
  employeeBreakdown: EmployeeSpendingStatistics[];

  @Field(() => [PlanSpendingStatistics])
  planBreakdown: PlanSpendingStatistics[];
}
