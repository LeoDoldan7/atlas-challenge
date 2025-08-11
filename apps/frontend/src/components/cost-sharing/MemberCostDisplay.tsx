import React from 'react';
import { Card, Stack, Group, Text, Grid } from '@mantine/core';

export type MemberType = 'employee' | 'spouse' | 'child';

interface MemberCostDisplayProps {
  memberType: MemberType;
  label: string;
  costPerMonth: number;
  companyPercent: number;
  employeePercent: number;
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

export const MemberCostDisplay: React.FC<MemberCostDisplayProps> = ({
  memberType,
  label,
  costPerMonth,
  companyPercent,
  employeePercent,
  childrenCount = 1,
}) => {
  const color = getMemberColor(memberType);
  const totalCost = memberType === 'child' ? costPerMonth * childrenCount : costPerMonth;
  
  return (
    <Card bg={`${color}.0`} padding="md" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={600} c={color} size="lg">{label}</Text>
          <Text fw={500}>
            ${totalCost.toFixed(2)}/month
            {memberType === 'child' && childrenCount > 1 && (
              <Text component="span" size="sm" c="dimmed"> (total)</Text>
            )}
          </Text>
        </Group>
        
        <Grid>
          <Grid.Col span={6}>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Company Pays</Text>
              <Group gap="xs">
                <Text fw={600} size="lg">{companyPercent}%</Text>
                <Text size="sm" c="dimmed">
                  (${(totalCost * companyPercent / 100).toFixed(2)})
                </Text>
              </Group>
            </Stack>
          </Grid.Col>
          <Grid.Col span={6}>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Employee Pays</Text>
              <Group gap="xs">
                <Text fw={600} size="lg">{employeePercent}%</Text>
                <Text size="sm" c="dimmed">
                  (${(totalCost * employeePercent / 100).toFixed(2)})
                </Text>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
        
        {memberType === 'child' && childrenCount > 1 && (
          <Text size="xs" c="dimmed">
            Per child: ${costPerMonth.toFixed(2)}/month
          </Text>
        )}
      </Stack>
    </Card>
  );
};