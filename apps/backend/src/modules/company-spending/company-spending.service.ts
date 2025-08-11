import { Injectable } from '@nestjs/common';
import {
  CompanySpendingRepository,
  SubscriptionWithRelations,
} from './company-spending.repository';
import { CompanySpendingMapper } from './company-spending.mapper';
import {
  CompanySpendingStatistics,
  EmployeeSpendingStatistics,
  PlanSpendingStatistics,
} from '../../graphql/company/types/company-spending-statistics.type';

@Injectable()
export class CompanySpendingService {
  constructor(
    private readonly repository: CompanySpendingRepository,
    private readonly mapper: CompanySpendingMapper,
  ) {}

  async getCompanySpendingStatistics(
    companyId: string,
  ): Promise<CompanySpendingStatistics> {
    const company = await this.repository.findCompanyById(companyId);

    if (!company) {
      throw new Error(`Company with ID ${companyId} not found`);
    }

    const subscriptions =
      await this.repository.findSubscriptionsByCompanyId(companyId);

    const employeeBreakdown = this.calculateEmployeeBreakdown(subscriptions);

    const planBreakdown = this.calculatePlanBreakdown(subscriptions);

    const totalMonthlyCostCents = employeeBreakdown.reduce(
      (sum, emp) => sum + emp.totalMonthlyCostCents,
      0,
    );
    const companyMonthlyCostCents = employeeBreakdown.reduce(
      (sum, emp) => sum + emp.companyMonthlyCostCents,
      0,
    );
    const employeeMonthlyCostCents = employeeBreakdown.reduce(
      (sum, emp) => sum + emp.employeeMonthlyCostCents,
      0,
    );

    return this.mapper.toGraphQL({
      company,
      totalMonthlyCostCents,
      companyMonthlyCostCents,
      employeeMonthlyCostCents,
      employeeBreakdown,
      planBreakdown,
    });
  }

  private calculateEmployeeBreakdown(
    subscriptions: SubscriptionWithRelations[],
  ): EmployeeSpendingStatistics[] {
    const employeeMap = new Map<string, EmployeeSpendingStatistics>();

    for (const subscription of subscriptions) {
      const employeeId = subscription.employee.id.toString();
      const employeeName = `${subscription.employee.demographics.first_name} ${subscription.employee.demographics.last_name}`;

      const costs = this.calculateSubscriptionCosts(subscription);

      if (employeeMap.has(employeeId)) {
        const existing = employeeMap.get(employeeId)!;
        existing.totalMonthlyCostCents += costs.totalMonthlyCostCents;
        existing.companyMonthlyCostCents += costs.companyMonthlyCostCents;
        existing.employeeMonthlyCostCents += costs.employeeMonthlyCostCents;
      } else {
        employeeMap.set(employeeId, {
          employeeId,
          employeeName,
          totalMonthlyCostCents: costs.totalMonthlyCostCents,
          companyMonthlyCostCents: costs.companyMonthlyCostCents,
          employeeMonthlyCostCents: costs.employeeMonthlyCostCents,
        });
      }
    }

    return Array.from(employeeMap.values());
  }

  private calculatePlanBreakdown(
    subscriptions: SubscriptionWithRelations[],
  ): PlanSpendingStatistics[] {
    const planMap = new Map<string, PlanSpendingStatistics>();

    for (const subscription of subscriptions) {
      const planId = subscription.plan.id.toString();
      const planName = subscription.plan.name;

      const costs = this.calculateSubscriptionCosts(subscription);

      if (planMap.has(planId)) {
        const existing = planMap.get(planId)!;
        existing.subscriptionCount += 1;
        existing.totalMonthlyCostCents += costs.totalMonthlyCostCents;
        existing.companyMonthlyCostCents += costs.companyMonthlyCostCents;
        existing.employeeMonthlyCostCents += costs.employeeMonthlyCostCents;
      } else {
        planMap.set(planId, {
          planId,
          planName,
          subscriptionCount: 1,
          totalMonthlyCostCents: costs.totalMonthlyCostCents,
          companyMonthlyCostCents: costs.companyMonthlyCostCents,
          employeeMonthlyCostCents: costs.employeeMonthlyCostCents,
        });
      }
    }

    return Array.from(planMap.values());
  }

  private calculateSubscriptionCosts(subscription: SubscriptionWithRelations) {
    const plan = subscription.plan;
    const items = subscription.items;

    let totalMonthlyCostCents = 0;
    let companyMonthlyCostCents = 0;

    for (const item of items) {
      let itemCostCents = 0;
      let companyPaidPercentage = 0;

      switch (item.role) {
        case 'employee':
          itemCostCents = Number(plan.cost_employee_cents);
          companyPaidPercentage =
            item.company_pct ?? Number(plan.pct_employee_paid_by_company);
          break;
        case 'spouse':
          itemCostCents = Number(plan.cost_spouse_cents);
          companyPaidPercentage =
            item.company_pct ?? Number(plan.pct_spouse_paid_by_company);
          break;
        case 'child':
          itemCostCents = Number(plan.cost_child_cents);
          companyPaidPercentage =
            item.company_pct ?? Number(plan.pct_child_paid_by_company);
          break;
      }

      const companyPaidCents = Math.round(
        (itemCostCents * companyPaidPercentage) / 100,
      );

      totalMonthlyCostCents += itemCostCents;
      companyMonthlyCostCents += companyPaidCents;
    }

    const employeeMonthlyCostCents =
      totalMonthlyCostCents - companyMonthlyCostCents;

    return {
      totalMonthlyCostCents,
      companyMonthlyCostCents,
      employeeMonthlyCostCents,
    };
  }
}
