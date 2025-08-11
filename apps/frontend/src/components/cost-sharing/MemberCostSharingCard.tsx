import React from 'react';
import { Card, Stack, Group, Text } from '@mantine/core';
import { CostSharingInput } from './CostSharingInput';

export type MemberType = 'employee' | 'spouse' | 'child';

interface MemberCostSharingCardProps {
  memberType: MemberType;
  label: string;
  costPerMonth: number;
  companyPercent: number;
  employeePercent: number;
  onCompanyPercentChange: (value: number | string) => void;
  onEmployeePercentChange: (value: number | string) => void;
  color?: string;
  disabled?: boolean;
  showBreakdown?: boolean;
  childrenCount?: number;
}

const getMemberColor = (memberType: MemberType): string => {
  switch (memberType) {
    case 'employee':
      return 'blue';
    case 'spouse':
      return 'teal';
    case 'child':
      return 'orange';
    default:
      return 'gray';
  }
};

export const MemberCostSharingCard: React.FC<MemberCostSharingCardProps> = ({
  memberType,
  label,
  costPerMonth,
  companyPercent,
  employeePercent,
  onCompanyPercentChange,
  onEmployeePercentChange,
  color,
  disabled = false,
  showBreakdown = true,
  childrenCount = 1,
}) => {
  const themeColor = color || getMemberColor(memberType);
  const totalCost = memberType === 'child' ? costPerMonth * childrenCount : costPerMonth;
  
  return (
    <Card bg="gray.0" padding="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={600} c={themeColor}>{label}</Text>
          <Text size="sm" c="dimmed">
            ${costPerMonth.toFixed(2)}/month{memberType === 'child' && childrenCount > 1 ? ' (per child)' : ''}
          </Text>
        </Group>
        
        <CostSharingInput
          companyPercent={companyPercent}
          employeePercent={employeePercent}
          onCompanyPercentChange={onCompanyPercentChange}
          onEmployeePercentChange={onEmployeePercentChange}
          disabled={disabled}
        />
        
        {showBreakdown && (
          <Text size="xs" c="dimmed">
            Company: ${(totalCost * companyPercent / 100).toFixed(2)}/month | 
            Employee: ${(totalCost * employeePercent / 100).toFixed(2)}/month
            {memberType === 'child' && childrenCount > 1 && (
              <> (total for {childrenCount} children)</>
            )}
          </Text>
        )}
      </Stack>
    </Card>
  );
};