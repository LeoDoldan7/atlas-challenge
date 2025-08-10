import { Injectable } from '@nestjs/common';
import {
  CompanySpendingStatistics,
  EmployeeSpendingStatistics,
  PlanSpendingStatistics,
} from '../../graphql/company/types/company-spending-statistics.type';

import { CompanySelect } from './company-spending.repository';

interface CompanySpendingData {
  company: CompanySelect;
  totalMonthlyCostCents: number;
  companyMonthlyCostCents: number;
  employeeMonthlyCostCents: number;
  employeeBreakdown: EmployeeSpendingStatistics[];
  planBreakdown: PlanSpendingStatistics[];
}

@Injectable()
export class CompanySpendingMapper {
  toGraphQL(data: CompanySpendingData): CompanySpendingStatistics {
    return {
      companyId: data.company.id.toString(),
      companyName: data.company.name,
      totalMonthlyCostCents: data.totalMonthlyCostCents,
      companyMonthlyCostCents: data.companyMonthlyCostCents,
      employeeMonthlyCostCents: data.employeeMonthlyCostCents,
      employeeBreakdown: data.employeeBreakdown,
      planBreakdown: data.planBreakdown,
    };
  }
}
