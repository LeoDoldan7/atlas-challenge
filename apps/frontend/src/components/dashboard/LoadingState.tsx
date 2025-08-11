import React from 'react';
import { Card, Stack, Loader, Text } from '@mantine/core';

export const LoadingState: React.FC = () => {
  return (
    <Card shadow="xl" padding="xl">
      <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
        <Loader size="xl" />
        <Text size="xl" fw={500}>Loading dashboard...</Text>
      </Stack>
    </Card>
  );
};