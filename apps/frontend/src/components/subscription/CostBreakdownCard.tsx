import React from 'react';
import { Card, Stack, Group, Text, Title, Badge } from '@mantine/core';
import { MemberCostDisplay, CompanyContributionSummary, TotalCostSummary } from '../cost-sharing';
import type { HealthcareSubscription } from '../../types';

interface CostBreakdownCardProps {
  subscription: HealthcareSubscription;
  spouseCount: number;
  childrenCount: number;
}

export const CostBreakdownCard: React.FC<CostBreakdownCardProps> = ({
  subscription,
  spouseCount,
  childrenCount,
}) => {
  const plan = subscription.plan;
  
  if (!plan) {
    return null;
  }

  // Find custom percentages from subscription items, fallback to plan defaults
  const employeeItem = subscription.items?.find(item => item.role === 'EMPLOYEE');
  const spouseItem = subscription.items?.find(item => item.role === 'SPOUSE');
  const childItem = subscription.items?.find(item => item.role === 'CHILD');

  const employeeCompanyPercent = employeeItem?.companyPct ?? parseInt(plan.pctEmployeePaidByCompany);
  const employeeEmployeePercent = employeeItem?.employeePct ?? (100 - parseInt(plan.pctEmployeePaidByCompany));
  const spouseCompanyPercent = spouseItem?.companyPct ?? parseInt(plan.pctSpousePaidByCompany);
  const spouseEmployeePercent = spouseItem?.employeePct ?? (100 - parseInt(plan.pctSpousePaidByCompany));
  const childCompanyPercent = childItem?.companyPct ?? parseInt(plan.pctChildPaidByCompany);
  const childEmployeePercent = childItem?.employeePct ?? (100 - parseInt(plan.pctChildPaidByCompany));

  const employeeCost = parseInt(plan.costEmployeeCents) / 100;
  const spouseCost = parseInt(plan.costSpouseCents) / 100;
  const childCost = parseInt(plan.costChildCents) / 100;

  return (
    <Card p="lg" radius="xl" shadow="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Title order={3} fw={600}>Cost Breakdown</Title>
          <Badge color="green" variant="light" size="lg">
            {subscription.type === 'INDIVIDUAL' ? 'Individual' : 'Family'} Plan
          </Badge>
        </Group>
        
        <Text c="dimmed" size="sm">
          Monthly cost sharing between company and employee for each coverage type
        </Text>

        <Stack gap="lg">
          <MemberCostDisplay
            memberType="employee"
            label="Employee Coverage"
            costPerMonth={employeeCost}
            companyPercent={employeeCompanyPercent}
            employeePercent={employeeEmployeePercent}
          />

          {spouseCount > 0 && (
            <MemberCostDisplay
              memberType="spouse"
              label="Spouse Coverage"
              costPerMonth={spouseCost}
              companyPercent={spouseCompanyPercent}
              employeePercent={spouseEmployeePercent}
            />
          )}

          {childrenCount > 0 && (
            <MemberCostDisplay
              memberType="child"
              label={`Child Coverage (${childrenCount} ${childrenCount === 1 ? 'child' : 'children'})`}
              costPerMonth={childCost}
              companyPercent={childCompanyPercent}
              employeePercent={childEmployeePercent}
              childrenCount={childrenCount}
            />
          )}

          <CompanyContributionSummary
            items={[
              {
                label: 'Employee Coverage',
                percentage: employeeCompanyPercent,
                amount: employeeCost * employeeCompanyPercent / 100,
              },
              ...(spouseCount > 0 ? [{
                label: 'Spouse Coverage',
                percentage: spouseCompanyPercent,
                amount: spouseCost * spouseCompanyPercent / 100,
              }] : []),
              ...(childrenCount > 0 ? [{
                label: 'Children Coverage',
                percentage: childCompanyPercent,
                amount: childCost * childCompanyPercent / 100 * childrenCount,
                count: childrenCount,
              }] : []),
            ]}
            totalAmount={
              (employeeCost * employeeCompanyPercent / 100) + 
              (spouseCount > 0 ? spouseCost * spouseCompanyPercent / 100 : 0) + 
              (childrenCount * childCost * childCompanyPercent / 100)
            }
          />

          <TotalCostSummary
            totalCost={
              employeeCost + 
              (spouseCount > 0 ? spouseCost : 0) + 
              (childrenCount * childCost)
            }
            companyPays={
              (employeeCost * employeeCompanyPercent / 100) + 
              (spouseCount > 0 ? spouseCost * spouseCompanyPercent / 100 : 0) + 
              (childrenCount * childCost * childCompanyPercent / 100)
            }
            employeePays={
              (employeeCost * employeeEmployeePercent / 100) + 
              (spouseCount > 0 ? spouseCost * spouseEmployeePercent / 100 : 0) + 
              (childrenCount * childCost * childEmployeePercent / 100)
            }
          />
        </Stack>
      </Stack>
    </Card>
  );
};