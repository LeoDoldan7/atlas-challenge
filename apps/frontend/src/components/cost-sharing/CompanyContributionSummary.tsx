import React from 'react';
import { Card, Stack, Group, Text, Grid } from '@mantine/core';

interface ContributionItem {
  label: string;
  percentage: number;
  amount: number;
  count?: number;
}

interface CompanyContributionSummaryProps {
  items: ContributionItem[];
  totalAmount: number;
}

export const CompanyContributionSummary: React.FC<CompanyContributionSummaryProps> = ({
  items,
  totalAmount,
}) => {
  return (
    <Card bg="blue.1" padding="md" radius="md">
      <Stack gap="md">
        <Text fw={600} size="lg" c="blue">Company Contribution Breakdown</Text>
        <Text size="sm" c="dimmed">
          Breakdown of what the company pays for each member type
        </Text>
        
        <Grid>
          <Grid.Col span={6}>
            <Stack gap="md">
              {items.map((item, index) => (
                <div key={index}>
                  <Group justify="space-between" mb="xs">
                    <Text fw={500}>
                      {item.label}
                      {item.count && item.count > 1 && ` (${item.count})`}
                    </Text>
                    <Text fw={600}>{item.percentage}%</Text>
                  </Group>
                  <Text size="xl" fw={700} c="blue">
                    ${item.amount.toFixed(2)}/month
                  </Text>
                </div>
              ))}
            </Stack>
          </Grid.Col>
          
          <Grid.Col span={6}>
            <Card bg="white" padding="lg" radius="md" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stack gap="md" align="center">
                <Text size="sm" c="dimmed" ta="center">Total Company Contribution</Text>
                <Text fw={900} size="2rem" c="blue" ta="center">
                  ${totalAmount.toFixed(2)}
                </Text>
                <Text size="xs" c="dimmed" ta="center">per month</Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
};