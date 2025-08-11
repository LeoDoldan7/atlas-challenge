import React from 'react';
import { Card, Stack, Group, Text, Title, Badge } from '@mantine/core';
import type { HealthcareSubscription } from '../../types';
import { formatDate, getStatusColor, formatStatusText } from '../../utils/subscriptionUtils';

interface SubscriptionOverviewCardProps {
  subscription: HealthcareSubscription;
  currentStep: string | null;
}

export const SubscriptionOverviewCard: React.FC<SubscriptionOverviewCardProps> = ({
  subscription,
  currentStep,
}) => {
  return (
    <Card p="lg" radius="xl" shadow="md">
      <Stack gap="md">
        <Group justify="apart" align="flex-start">
          <Title order={3} fw={600}>Overview</Title>
          <Badge color={getStatusColor(currentStep || subscription.status)} variant="light" size="lg">
            {formatStatusText(currentStep || subscription.status)}
          </Badge>
        </Group>
        
        <Text c="dimmed">
          Subscription ID: {subscription.id}
        </Text>

        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} c="dimmed" mb={4}>Start Date</Text>
            <Text size="lg">{formatDate(subscription.startDate)}</Text>
          </div>

          {subscription.endDate && (
            <div>
              <Text size="sm" fw={500} c="dimmed" mb={4}>End Date</Text>
              <Text size="lg" c="red">{formatDate(subscription.endDate)}</Text>
            </div>
          )}

          <div>
            <Text size="sm" fw={500} c="dimmed" mb={4}>Billing Anchor</Text>
            <Text size="lg">{subscription.billingAnchor} of each month</Text>
          </div>

          <div>
            <Text size="sm" fw={500} c="dimmed" mb={4}>Type</Text>
            <Text size="lg" tt="capitalize">{subscription.type.toLowerCase()}</Text>
          </div>
        </Stack>
      </Stack>
    </Card>
  );
};