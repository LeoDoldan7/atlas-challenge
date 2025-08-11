import React from 'react';
import { Stack, Title, Text } from '@mantine/core';

export const EmployeesPageHeader: React.FC = () => {
  return (
    <Stack gap="xs">
      <Title order={1} size={36} fw={700}>
        Employees
      </Title>
      <Text size="lg" c="dimmed">
        Manage company employees and their healthcare subscriptions
      </Text>
    </Stack>
  );
};