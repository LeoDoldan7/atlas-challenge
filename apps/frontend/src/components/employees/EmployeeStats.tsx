import React from 'react';
import { Card, Group, ThemeIcon, Stack, Text } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';

interface EmployeeStatsProps {
  totalEmployees: number;
}

export const EmployeeStats: React.FC<EmployeeStatsProps> = ({ totalEmployees }) => {
  return (
    <Card p="lg" radius="xl" shadow="md">
      <Group gap="lg">
        <ThemeIcon size={48} radius="xl" color="blue" variant="light">
          <IconUsers size={24} />
        </ThemeIcon>
        <Stack gap="xs">
          <Text fw={500} c="dimmed">Total Employees</Text>
          <Text size="xl" fw={700}>{totalEmployees}</Text>
        </Stack>
      </Group>
    </Card>
  );
};