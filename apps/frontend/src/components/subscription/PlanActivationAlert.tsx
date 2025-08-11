import React from 'react';
import {
  Alert,
  Stack,
  Group,
  Text,
  Button,
  ThemeIcon
} from '@mantine/core';
import { IconClock } from '@tabler/icons-react';

interface PlanActivationAlertProps {
  onActivate: () => void;
  isActivating: boolean;
}

export const PlanActivationAlert: React.FC<PlanActivationAlertProps> = ({
  onActivate,
  isActivating,
}) => {
  return (
    <Alert color="orange" radius="md">
      <Group gap="md" align="flex-start">
        <ThemeIcon size={24} color="orange" variant="light">
          <IconClock size={16} />
        </ThemeIcon>
        <Stack gap="xs" style={{ flex: 1 }}>
          <Text fw={500}>Ready for Activation</Text>
          <Text size="sm">
            Your documents and demographic information have been reviewed and approved. 
            You can now activate your healthcare plan.
          </Text>
          <Button
            onClick={onActivate}
            loading={isActivating}
            color="green"
            radius="xl"
            size="sm"
            mt="sm"
          >
            {isActivating ? 'Activating...' : 'Activate Plan'}
          </Button>
        </Stack>
      </Group>
    </Alert>
  );
};