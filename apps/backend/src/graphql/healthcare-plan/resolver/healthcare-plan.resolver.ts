import { Resolver, Query } from '@nestjs/graphql';
import { HealthcarePlan } from '../types/healthcare-plan.type';
import { PrismaService } from '../../../prisma/prisma.service';

@Resolver(() => HealthcarePlan)
export class HealthcarePlanResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [HealthcarePlan], {
    name: 'healthcarePlans',
    description: 'Get all healthcare plans without relations',
  })
  async healthcarePlans(): Promise<HealthcarePlan[]> {
    const plans = await this.prisma.healthcarePlan.findMany({
      select: {
        id: true,
        name: true,
        cost_employee_cents: true,
        pct_employee_paid_by_company: true,
        cost_spouse_cents: true,
        pct_spouse_paid_by_company: true,
        cost_child_cents: true,
        pct_child_paid_by_company: true,
      },
    });

    return plans.map((plan) => ({
      id: plan.id.toString(),
      name: plan.name,
      costEmployeeCents: plan.cost_employee_cents.toString(),
      pctEmployeePaidByCompany: plan.pct_employee_paid_by_company.toString(),
      costSpouseCents: plan.cost_spouse_cents.toString(),
      pctSpousePaidByCompany: plan.pct_spouse_paid_by_company.toString(),
      costChildCents: plan.cost_child_cents.toString(),
      pctChildPaidByCompany: plan.pct_child_paid_by_company.toString(),
    }));
  }
}
