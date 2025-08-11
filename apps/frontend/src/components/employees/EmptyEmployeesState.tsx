import React from 'react';
import { Card, Stack, ThemeIcon, Title, Text } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';

export const EmptyEmployeesState: React.FC = () => {
  return (
    <Card p="xl" radius="xl" shadow="md">
      <Stack align="center" gap="md">
        <ThemeIcon size={64} radius="xl" color="gray" variant="light">
          <IconUser size={32} />
        </ThemeIcon>
        <Title order={3}>No Employees Found</Title>
        <Text c="dimmed" ta="center">
          There are currently no employees in the system.
        </Text>
      </Stack>
    </Card>
  );
};