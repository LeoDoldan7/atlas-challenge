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
import { IconX, IconAlertCircle } from '@tabler/icons-react';
import type { HealthcareSubscription } from '../../types';
import { formatDate } from '../../utils/subscriptionUtils';

interface CancelledTerminatedSubscriptionCardProps {
  subscription: HealthcareSubscription;
}

export const CancelledTerminatedSubscriptionCard: React.FC<CancelledTerminatedSubscriptionCardProps> = ({ subscription }) => {
  const isCancelled = subscription.status === 'CANCELLED';
  
  return (
    <Card p="lg" radius="xl" shadow="md">
      <Stack gap="lg">
        <Group gap="sm">
          <IconX size={20} style={{ color: 'var(--mantine-color-red-6)' }} />
          <Title order={3} fw={600}>
            {isCancelled ? 'Subscription Cancelled' : 'Subscription Terminated'}
          </Title>
        </Group>
        
        <Text c="dimmed">
          This subscription is no longer active.
        </Text>

        <Alert color="red" radius="md">
          <Group gap="md" align="flex-start">
            <ThemeIcon size={24} color="red" variant="light">
              <IconAlertCircle size={16} />
            </ThemeIcon>
            <Stack gap="md" style={{ flex: 1 }}>
              <Text fw={500}>
                {isCancelled ? 'Cancelled' : 'Terminated'}
              </Text>
              <Text size="sm">
                {isCancelled 
                  ? 'This subscription has been cancelled and is no longer providing coverage.'
                  : 'This subscription has been terminated and is no longer providing coverage.'
                }
              </Text>
              {subscription.endDate && (
                <Card p="md" radius="md" withBorder mt="sm">
                  <Stack gap="xs">
                    <Text fw={500}>Coverage Ended</Text>
                    <Text c="dimmed">{formatDate(subscription.endDate)}</Text>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Group>
        </Alert>
      </Stack>
    </Card>
  );
};