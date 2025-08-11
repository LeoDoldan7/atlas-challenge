import React from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Title
} from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import type { HealthcareSubscriptionFile } from '../../types';
import { usePlanActivation } from '../../hooks/usePlanActivation';
import { PlanActivationAlert } from './PlanActivationAlert';
import { SubmittedDocumentsList } from './SubmittedDocumentsList';

interface PlanActivationCardProps {
  subscriptionId: string;
  files: HealthcareSubscriptionFile[] | null;
  onSuccess: () => void;
}

export const PlanActivationCard: React.FC<PlanActivationCardProps> = ({
  subscriptionId,
  files,
  onSuccess,
}) => {
  const planActivation = usePlanActivation({
    subscriptionId,
    onSuccess,
  });

  return (
    <Card p="lg" radius="xl" shadow="md">
      <Stack gap="lg">
        <Group gap="sm">
          <IconClock size={20} style={{ color: 'var(--mantine-color-orange-6)' }} />
          <Title order={3} fw={600}>Plan Activation Pending</Title>
        </Group>
        
        <Text c="dimmed">
          Your documents have been received and are being reviewed.
        </Text>

        <Stack gap="lg">
          <PlanActivationAlert
            onActivate={planActivation.handlePlanActivation}
            isActivating={planActivation.isActivating}
          />
          
          <SubmittedDocumentsList files={files} />
        </Stack>
      </Stack>
    </Card>
  );
};