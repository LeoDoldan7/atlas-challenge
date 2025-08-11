import React from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Title,
  Alert,
  ThemeIcon,
  SimpleGrid
} from '@mantine/core';
import { IconCheck, IconUser } from '@tabler/icons-react';
import type { HealthcareSubscription, HealthcareSubscriptionItem } from '../../types';
import { formatDate } from '../../utils/subscriptionUtils';

interface ActiveSubscriptionCardProps {
  subscription: HealthcareSubscription;
}

export const ActiveSubscriptionCard: React.FC<ActiveSubscriptionCardProps> = ({ subscription }) => {
  return (
    <Card p="lg" radius="xl" shadow="md">
      <Stack gap="lg">
        <Group gap="sm">
          <IconCheck size={20} style={{ color: 'var(--mantine-color-green-6)' }} />
          <Title order={3} fw={600}>Active Subscription</Title>
        </Group>
        
        <Text c="dimmed">
          Your healthcare subscription is now active and ready to use.
        </Text>

        <Stack gap="lg">
          <Alert color="green" radius="md">
            <Group gap="md" align="flex-start">
              <ThemeIcon size={24} color="green" variant="light">
                <IconCheck size={16} />
              </ThemeIcon>
              <Stack gap="md" style={{ flex: 1 }}>
                <Text fw={500}>Subscription Active</Text>
                <Text size="sm">
                  Congratulations! Your healthcare subscription is now active. You can start using your benefits immediately.
                </Text>
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mt="sm">
                  <Card p="md" radius="md" withBorder>
                    <Stack gap="xs">
                      <Text fw={500}>Coverage Starts</Text>
                      <Text c="dimmed">{formatDate(subscription.startDate)}</Text>
                    </Stack>
                  </Card>
                  <Card p="md" radius="md" withBorder>
                    <Stack gap="xs">
                      <Text fw={500}>Monthly Billing</Text>
                      <Text c="dimmed">{subscription.billingAnchor} of each month</Text>
                    </Stack>
                  </Card>
                </SimpleGrid>
              </Stack>
            </Group>
          </Alert>

          <Stack gap="md">
            <Title order={5} fw={500}>Covered Members:</Title>
            <Stack gap="xs">
              {subscription.items?.map((item: HealthcareSubscriptionItem) => (
                <Card key={item.id} p="md" radius="md" bg="gray.1">
                  <Group gap="md">
                    <ThemeIcon size={40} radius="md" color="gray" variant="light">
                      <IconUser size={20} />
                    </ThemeIcon>
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text fw={500} tt="capitalize">{item.role.toLowerCase()}</Text>
                      {item.demographicId && (
                        <Text size="sm" c="dimmed">Verified</Text>
                      )}
                    </Stack>
                    <ThemeIcon size={24} color="green" variant="light">
                      <IconCheck size={16} />
                    </ThemeIcon>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
};