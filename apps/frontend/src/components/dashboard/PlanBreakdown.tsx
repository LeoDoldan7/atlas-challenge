import React from 'react';
import { Card, Group, ThemeIcon, Title, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconChartPie } from '@tabler/icons-react';

interface PlanSpendingStatistics {
  planId: string;
  planName: string;
  subscriptionCount: number;
  totalMonthlyCostCents: number;
  companyMonthlyCostCents: number;
  employeeMonthlyCostCents: number;
}

interface PlanBreakdownProps {
  planBreakdown: PlanSpendingStatistics[];
  formatCurrency: (cents: number) => string;
}

export const PlanBreakdown: React.FC<PlanBreakdownProps> = ({
  planBreakdown,
  formatCurrency,
}) => {
  return (
    <Card shadow="xl" padding="xl">
      <Group gap="md" mb="xl">
        <ThemeIcon size="lg" variant="light" color="blue">
          <IconChartPie size={24} />
        </ThemeIcon>
        <Title order={3}>Plan Breakdown</Title>
      </Group>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {planBreakdown.map((plan) => (
          <Card key={plan.planId} shadow="sm" padding="lg" bg="gray.0">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Title order={4}>{plan.planName}</Title>
                <Text size="sm" c="dimmed">{plan.subscriptionCount} subscriptions</Text>
              </Group>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text c="dimmed">Total Monthly:</Text>
                  <Text fw={500}>{formatCurrency(plan.totalMonthlyCostCents)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">Company Pays:</Text>
                  <Text fw={500} c="green">{formatCurrency(plan.companyMonthlyCostCents)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">Employee Pays:</Text>
                  <Text fw={500} c="blue">{formatCurrency(plan.employeeMonthlyCostCents)}</Text>
                </Group>
              </Stack>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Card>
  );
};