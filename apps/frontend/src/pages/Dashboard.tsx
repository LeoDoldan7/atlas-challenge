import React from "react";
import { useQuery } from "@apollo/client";
import { COMPANY_SPENDING_STATISTICS_QUERY } from "../lib/queries";
import { Container, Stack } from "@mantine/core";
import {
  DashboardHero,
  LoadingState,
  ErrorState,
  CompanyOverview,
  CostOverviewCards,
  EmployeeBreakdown,
  PlanBreakdown,
} from "../components/dashboard";

interface CompanySpendingStatistics {
  companyId: string;
  companyName: string;
  totalMonthlyCostCents: number;
  companyMonthlyCostCents: number;
  employeeMonthlyCostCents: number;
  employeeBreakdown: EmployeeSpendingStatistics[];
  planBreakdown: PlanSpendingStatistics[];
}

interface EmployeeSpendingStatistics {
  employeeId: string;
  employeeName: string;
  totalMonthlyCostCents: number;
  companyMonthlyCostCents: number;
  employeeMonthlyCostCents: number;
}

interface PlanSpendingStatistics {
  planId: string;
  planName: string;
  subscriptionCount: number;
  totalMonthlyCostCents: number;
  companyMonthlyCostCents: number;
  employeeMonthlyCostCents: number;
}

const Dashboard: React.FC = () => {
  const { data, loading, error } = useQuery<{ getCompanySpendingStatistics: CompanySpendingStatistics }>(
    COMPANY_SPENDING_STATISTICS_QUERY,
    {
      variables: { companyId: "1" },
    }
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const statistics = data?.getCompanySpendingStatistics;

    console.log('### statistics',statistics)
  return (
    <Container size="xl" py={48}>
      <DashboardHero />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} />
      ) : statistics ? (
        <Stack gap="xl">
          <CompanyOverview 
            companyName={statistics.companyName} 
            companyId={statistics.companyId} 
          />

          <CostOverviewCards
            totalMonthlyCostCents={statistics.totalMonthlyCostCents}
            companyMonthlyCostCents={statistics.companyMonthlyCostCents}
            employeeMonthlyCostCents={statistics.employeeMonthlyCostCents}
            formatCurrency={formatCurrency}
          />

          <EmployeeBreakdown
            employeeBreakdown={statistics.employeeBreakdown}
            formatCurrency={formatCurrency}
          />

          <PlanBreakdown
            planBreakdown={statistics.planBreakdown}
            formatCurrency={formatCurrency}
          />
        </Stack>
      ) : null}
    </Container>
  );
};

export default Dashboard;