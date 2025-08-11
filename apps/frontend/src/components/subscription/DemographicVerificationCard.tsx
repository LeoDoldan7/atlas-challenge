import React from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Title,
  Button
} from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useDemographicForm } from '../../hooks/useDemographicForm';
import { SpouseInformationSection } from './SpouseInformationSection';
import { ChildrenInformationSection } from './ChildrenInformationSection';

interface DemographicVerificationCardProps {
  subscriptionId: string;
  spouseCount: number;
  childrenCount: number;
  onSuccess: () => void;
}

export const DemographicVerificationCard: React.FC<DemographicVerificationCardProps> = ({
  subscriptionId,
  spouseCount,
  childrenCount,
  onSuccess,
}) => {
  const demographicForm = useDemographicForm({
    subscriptionId,
    spouseCount,
    childrenCount,
    onSuccess,
  });

  return (
    <Card p="lg" radius="xl" shadow="md">
      <Stack gap="lg">
        <Group gap="sm">
          <IconUsers size={20} />
          <Title order={3} fw={600}>Demographic Verification</Title>
        </Group>
        
        <Text c="dimmed">
          Please provide demographic information for family members covered under this subscription.
        </Text>

        <form onSubmit={demographicForm.handleSubmit}>
          <Stack gap="xl">
            <SpouseInformationSection 
              spouseCount={spouseCount}
              register={demographicForm.register}
              errors={demographicForm.errors}
            />

            <ChildrenInformationSection 
              childrenCount={childrenCount}
              register={demographicForm.register}
              errors={demographicForm.errors}
            />

            <Group justify="end" pt="md">
              <Button
                type="submit"
                loading={demographicForm.isSubmitting}
                radius="xl"
                size="md"
              >
                {demographicForm.isSubmitting ? 'Saving...' : 'Save Demographic Information'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Card>
  );
};