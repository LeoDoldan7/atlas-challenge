import { Injectable } from '@nestjs/common';
import { HealthcarePlan } from '../../graphql/healthcare-plan/types/healthcare-plan.type';
import { HealthcarePlanSelect } from './healthcare-plan.repository';

@Injectable()
export class HealthcarePlanMapper {
  toGraphQL(plan: HealthcarePlanSelect): HealthcarePlan {
    return {
      id: plan.id.toString(),
      name: plan.name,
      costEmployeeCents: plan.cost_employee_cents.toString(),
      pctEmployeePaidByCompany: plan.pct_employee_paid_by_company.toString(),
      costSpouseCents: plan.cost_spouse_cents.toString(),
      pctSpousePaidByCompany: plan.pct_spouse_paid_by_company.toString(),
      costChildCents: plan.cost_child_cents.toString(),
      pctChildPaidByCompany: plan.pct_child_paid_by_company.toString(),
    };
  }
}
