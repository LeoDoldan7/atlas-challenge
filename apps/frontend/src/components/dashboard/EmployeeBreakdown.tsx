import React from 'react';
import { Card, Group, ThemeIcon, Title, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';

interface EmployeeSpendingStatistics {
  employeeId: string;
  employeeName: string;
  totalMonthlyCostCents: number;
  companyMonthlyCostCents: number;
  employeeMonthlyCostCents: number;
}

interface EmployeeBreakdownProps {
  employeeBreakdown: EmployeeSpendingStatistics[];
  formatCurrency: (cents: number) => string;
}

export const EmployeeBreakdown: React.FC<EmployeeBreakdownProps> = ({
  employeeBreakdown,
  formatCurrency,
}) => {
  return (
    <Card shadow="xl" padding="xl">
      <Group gap="md" mb="xl">
        <ThemeIcon size="lg" variant="light" color="blue">
          <IconUsers size={24} />
        </ThemeIcon>
        <Title order={3}>Employee Breakdown</Title>
      </Group>
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
        {employeeBreakdown.map((employee) => (
          <Card key={employee.employeeId} shadow="sm" padding="md" bg="gray.0">
            <Stack gap="xs">
              <Text fw={500} size="sm">{employee.employeeName}</Text>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Total:</Text>
                <Text size="sm" fw={500}>{formatCurrency(employee.totalMonthlyCostCents)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Company:</Text>
                <Text size="sm" fw={500} c="green">{formatCurrency(employee.companyMonthlyCostCents)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Employee:</Text>
                <Text size="sm" fw={500} c="blue">{formatCurrency(employee.employeeMonthlyCostCents)}</Text>
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Card>
  );
};