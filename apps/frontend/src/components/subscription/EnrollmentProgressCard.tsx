import React from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Title,
  ThemeIcon
} from '@mantine/core';
import { IconCheck, IconClock } from '@tabler/icons-react';
import type { HealthcareSubscription } from '../../types';
import { formatDate } from '../../utils/subscriptionUtils';

interface EnrollmentProgressCardProps {
  subscription: HealthcareSubscription;
}

export const EnrollmentProgressCard: React.FC<EnrollmentProgressCardProps> = ({ subscription }) => {
  if (subscription.status !== 'PENDING' || !subscription.steps) {
    return null;
  }

  return (
    <Card p="lg" radius="xl" shadow="md">
      <Stack gap="lg">
        <Group gap="sm">
          <IconClock size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Title order={3} fw={600}>Enrollment Progress</Title>
        </Group>
        
        <Text c="dimmed">
          Track the progress of your subscription enrollment.
        </Text>

        <Stack gap="md">
          {subscription.steps.map((step) => (
            <Card key={step.id} p="md" radius="md" bg={step.status === 'COMPLETED' ? 'green.1' : 'gray.1'}>
              <Group gap="md">
                <ThemeIcon 
                  size={40} 
                  radius="md" 
                  color={step.status === 'COMPLETED' ? 'green' : 'gray'} 
                  variant="light"
                >
                  {step.status === 'COMPLETED' ? <IconCheck size={20} /> : <IconClock size={20} />}
                </ThemeIcon>
                <Stack gap={4} style={{ flex: 1 }}>
                  <Text fw={500}>
                    {step.type === 'DEMOGRAPHIC_VERIFICATION' && 'Demographic Verification'}
                    {step.type === 'DOCUMENT_UPLOAD' && 'Document Upload'}
                    {step.type === 'PLAN_ACTIVATION' && 'Plan Activation'}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {step.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                    {step.completedAt && ` on ${formatDate(step.completedAt)}`}
                  </Text>
                </Stack>
              </Group>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
};