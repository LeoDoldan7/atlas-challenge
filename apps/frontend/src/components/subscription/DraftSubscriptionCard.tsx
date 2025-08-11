import React from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Title,
  Alert,
  ThemeIcon
} from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import type { HealthcareSubscription } from '../../types';

interface DraftSubscriptionCardProps {
  subscription: HealthcareSubscription;
}

export const DraftSubscriptionCard: React.FC<DraftSubscriptionCardProps> = () => {
  return (
    <Card p="lg" radius="xl" shadow="md">
      <Stack gap="lg">
        <Group gap="sm">
          <IconClock size={20} style={{ color: 'var(--mantine-color-gray-6)' }} />
          <Title order={3} fw={600}>Draft Subscription</Title>
        </Group>
        
        <Text c="dimmed">
          This subscription is in draft status and has not been activated yet.
        </Text>

        <Alert color="gray" radius="md">
          <Group gap="md" align="flex-start">
            <ThemeIcon size={24} color="gray" variant="light">
              <IconClock size={16} />
            </ThemeIcon>
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text fw={500}>Waiting for Activation</Text>
              <Text size="sm">
                This subscription needs to be activated to begin the enrollment process.
              </Text>
            </Stack>
          </Group>
        </Alert>
      </Stack>
    </Card>
  );
};