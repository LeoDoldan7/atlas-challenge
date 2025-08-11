import React from 'react';
import { Card, Stack, Group, Text, Title } from '@mantine/core';
import { MemberCostSharingCard } from './MemberCostSharingCard';
import type { HealthcarePlan } from '../../types';

interface CostSharingConfigurationProps {
  plan: HealthcarePlan;
  employeeCompanyPercent: number;
  employeeEmployeePercent: number;
  spouseCompanyPercent: number;
  spouseEmployeePercent: number;
  childCompanyPercent: number;
  childEmployeePercent: number;
  spouseIncluded: boolean;
  childrenCount: number;
  onCompanyPercentChange: (value: number | string, memberType: 'employee' | 'spouse' | 'child') => void;
  onEmployeePercentChange: (value: number | string, memberType: 'employee' | 'spouse' | 'child') => void;
  disabled?: boolean;
}

export const CostSharingConfiguration: React.FC<CostSharingConfigurationProps> = ({
  plan,
  employeeCompanyPercent,
  employeeEmployeePercent,
  spouseCompanyPercent,
  spouseEmployeePercent,
  childCompanyPercent,
  childEmployeePercent,
  spouseIncluded,
  childrenCount,
  onCompanyPercentChange,
  onEmployeePercentChange,
  disabled = false,
}) => {
  return (
    <Card shadow="lg" padding="lg">
      <Stack gap="md">
        <Group gap="xs">
          <div style={{ width: 8, height: 8, backgroundColor: 'var(--mantine-color-orange-6)', borderRadius: '50%' }} />
          <Title order={3}>Cost Sharing Configuration</Title>
        </Group>
        <Text c="dimmed">
          Configure how much the company vs employee pays for each member type. Percentages must add up to 100%.
        </Text>

        <Stack gap="lg">
          <MemberCostSharingCard
            memberType="employee"
            label="Employee Coverage"
            costPerMonth={parseInt(plan.costEmployeeCents) / 100}
            companyPercent={employeeCompanyPercent}
            employeePercent={employeeEmployeePercent}
            onCompanyPercentChange={(value) => onCompanyPercentChange(value, 'employee')}
            onEmployeePercentChange={(value) => onEmployeePercentChange(value, 'employee')}
            disabled={disabled}
          />

          {spouseIncluded && (
            <MemberCostSharingCard
              memberType="spouse"
              label="Spouse Coverage"
              costPerMonth={parseInt(plan.costSpouseCents) / 100}
              companyPercent={spouseCompanyPercent}
              employeePercent={spouseEmployeePercent}
              onCompanyPercentChange={(value) => onCompanyPercentChange(value, 'spouse')}
              onEmployeePercentChange={(value) => onEmployeePercentChange(value, 'spouse')}
              disabled={disabled}
            />
          )}

          {childrenCount > 0 && (
            <MemberCostSharingCard
              memberType="child"
              label={`Child Coverage (${childrenCount} ${childrenCount === 1 ? 'child' : 'children'})`}
              costPerMonth={parseInt(plan.costChildCents) / 100}
              companyPercent={childCompanyPercent}
              employeePercent={childEmployeePercent}
              onCompanyPercentChange={(value) => onCompanyPercentChange(value, 'child')}
              onEmployeePercentChange={(value) => onEmployeePercentChange(value, 'child')}
              disabled={disabled}
              childrenCount={childrenCount}
            />
          )}
        </Stack>
      </Stack>
    </Card>
  );
};