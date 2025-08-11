import React from 'react';
import { SimpleGrid, Card, Group, Text, ThemeIcon } from '@mantine/core';
import { IconCurrencyDollar, IconTrendingUp, IconUsers } from '@tabler/icons-react';

interface CostOverviewCardsProps {
  totalMonthlyCostCents: number;
  companyMonthlyCostCents: number;
  employeeMonthlyCostCents: number;
  formatCurrency: (cents: number) => string;
}

export const CostOverviewCards: React.FC<CostOverviewCardsProps> = ({
  totalMonthlyCostCents,
  companyMonthlyCostCents,
  employeeMonthlyCostCents,
  formatCurrency,
}) => {
  return (
    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
      <Card shadow="lg" padding="lg">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>Total Monthly Cost</Text>
          <ThemeIcon size="sm" variant="light">
            <IconCurrencyDollar size={16} />
          </ThemeIcon>
        </Group>
        <Text size="xl" fw={700}>{formatCurrency(totalMonthlyCostCents)}</Text>
        <Text size="xs" c="dimmed">Total healthcare spending</Text>
      </Card>

      <Card shadow="lg" padding="lg">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>Company Contribution</Text>
          <ThemeIcon size="sm" variant="light" color="green">
            <IconTrendingUp size={16} />
          </ThemeIcon>
        </Group>
        <Text size="xl" fw={700} c="green">{formatCurrency(companyMonthlyCostCents)}</Text>
        <Text size="xs" c="dimmed">Company pays monthly</Text>
      </Card>

      <Card shadow="lg" padding="lg">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>Employee Contribution</Text>
          <ThemeIcon size="sm" variant="light" color="blue">
            <IconUsers size={16} />
          </ThemeIcon>
        </Group>
        <Text size="xl" fw={700} c="blue">{formatCurrency(employeeMonthlyCostCents)}</Text>
        <Text size="xs" c="dimmed">Employees pay monthly</Text>
      </Card>
    </SimpleGrid>
  );
};