import React from "react";
import { useQuery } from "@apollo/client";
import { COMPANY_SPENDING_STATISTICS_QUERY } from "../lib/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, Building, PieChart, TrendingUp } from "lucide-react";

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-28 -left-28 h-72 w-72 rounded-full bg-blue-400/25 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-400/20 blur-3xl animate-blob animation-delay-2000" />
      <div className="pointer-events-none absolute -right-28 top-32 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl animate-blob animation-delay-4000" />

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pt-20 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mt-8 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl dark:text-white">
            Company Dashboard
          </h1>
          <p className="mt-6 text-xl leading-8 text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            View comprehensive spending statistics and analytics for your healthcare benefits.
          </p>
        </div>
      </section>

      {/* Main */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center">
            <Card className="w-full max-w-4xl rounded-3xl border-slate-200/50 bg-white/95 shadow-2xl backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
                <span className="text-xl font-medium text-slate-700">Loading dashboard...</span>
              </CardContent>
            </Card>
          </div>
        ) : error ? (
          <div className="flex justify-center">
            <Card className="w-full max-w-4xl rounded-3xl border-slate-200/50 bg-white/95 shadow-2xl backdrop-blur-sm">
              <CardContent className="text-center py-16">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-3 text-slate-900">Failed to load dashboard</h2>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  {error.message || 'An error occurred while fetching company statistics'}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : statistics ? (
          <div className="space-y-8">
            {/* Company Overview */}
            <Card className="rounded-3xl border-slate-200/50 bg-white/95 shadow-2xl backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building className="h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900">{statistics.companyName}</CardTitle>
                    <CardDescription className="text-slate-600">Company ID: {statistics.companyId}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Cost Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="rounded-2xl border-slate-200/50 bg-white/95 shadow-lg backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Monthly Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(statistics.totalMonthlyCostCents)}</div>
                  <p className="text-xs text-muted-foreground">
                    Total healthcare spending
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/50 bg-white/95 shadow-lg backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Company Contribution</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(statistics.companyMonthlyCostCents)}</div>
                  <p className="text-xs text-muted-foreground">
                    Company pays monthly
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/50 bg-white/95 shadow-lg backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Employee Contribution</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(statistics.employeeMonthlyCostCents)}</div>
                  <p className="text-xs text-muted-foreground">
                    Employees pay monthly
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Employee Breakdown */}
            <Card className="rounded-3xl border-slate-200/50 bg-white/95 shadow-2xl backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-xl font-bold">Employee Breakdown</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statistics.employeeBreakdown.map((employee) => (
                    <Card key={employee.employeeId} className="rounded-xl border-slate-200/50 bg-slate-50/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">{employee.employeeName}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Total:</span>
                          <span className="font-medium">{formatCurrency(employee.totalMonthlyCostCents)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Company:</span>
                          <span className="font-medium text-green-600">{formatCurrency(employee.companyMonthlyCostCents)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Employee:</span>
                          <span className="font-medium text-blue-600">{formatCurrency(employee.employeeMonthlyCostCents)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Plan Breakdown */}
            <Card className="rounded-3xl border-slate-200/50 bg-white/95 shadow-2xl backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <PieChart className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-xl font-bold">Plan Breakdown</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {statistics.planBreakdown.map((plan) => (
                    <Card key={plan.planId} className="rounded-xl border-slate-200/50 bg-slate-50/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold">{plan.planName}</CardTitle>
                          <span className="text-sm text-slate-600">{plan.subscriptionCount} subscriptions</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total Monthly:</span>
                          <span className="font-medium">{formatCurrency(plan.totalMonthlyCostCents)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Company Pays:</span>
                          <span className="font-medium text-green-600">{formatCurrency(plan.companyMonthlyCostCents)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Employee Pays:</span>
                          <span className="font-medium text-blue-600">{formatCurrency(plan.employeeMonthlyCostCents)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default Dashboard;