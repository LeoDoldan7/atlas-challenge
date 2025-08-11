import React from 'react';
import { Stack, Title, Text } from '@mantine/core';

export const DashboardHero: React.FC = () => {
  return (
    <Stack align="center" mb={48}>
      <Title order={1} size={48} ta="center" fw={900}>
        Company Dashboard
      </Title>
      <Text size="xl" c="dimmed" ta="center" maw={600}>
        View comprehensive spending statistics and analytics for your healthcare benefits.
      </Text>
    </Stack>
  );
};