import React from 'react';
import { Card, Stack, Group, Title, Text, Badge } from '@mantine/core';
import type { SubscriptionType } from '../../types';

interface SelectedEmployee {
  id: string;
  email: string;
  birthDate: string;
  maritalStatus: string;
  demographic: {
    firstName: string;
    lastName: string;
  };
}

interface SubscriptionPreviewProps {
  subscriptionType: SubscriptionType;
  selectedEmployee?: SelectedEmployee;
}

export const SubscriptionPreview: React.FC<SubscriptionPreviewProps> = ({
  subscriptionType,
  selectedEmployee,
}) => {
  return (
    <Card shadow="lg" padding="lg" bg="blue.0">
      <Stack gap="md">
        <Group gap="xs">
          <div style={{ width: 8, height: 8, backgroundColor: 'var(--mantine-color-violet-6)', borderRadius: '50%' }} />
          <Title order={3}>Subscription Preview</Title>
        </Group>
        <Text c="dimmed">Based on your coverage selections</Text>

        <Group justify="space-between" p="md" bg="white" style={{ borderRadius: 8 }}>
          <Text fw={500}>Subscription type:</Text>
          <Badge 
            variant={subscriptionType === 'INDIVIDUAL' ? 'light' : 'filled'}
            color={subscriptionType === 'INDIVIDUAL' ? 'gray' : 'blue'}
          >
            {subscriptionType.toLowerCase()}
          </Badge>
        </Group>

        {selectedEmployee && (
          <Card bg="white" padding="lg" style={{ borderRadius: 12 }}>
            <Stack gap="xs">
              <Title order={4}>Selected Employee</Title>
              <Text size="sm">
                <Text component="span" fw={500}>Name:</Text> {selectedEmployee.demographic.firstName} {selectedEmployee.demographic.lastName}
              </Text>
              <Text size="sm">
                <Text component="span" fw={500}>Email:</Text> {selectedEmployee.email}
              </Text>
              <Text size="sm">
                <Text component="span" fw={500}>Marital Status:</Text> {selectedEmployee.maritalStatus}
              </Text>
              <Text size="sm">
                <Text component="span" fw={500}>Birth Date:</Text> {new Date(selectedEmployee.birthDate).toLocaleDateString()}
              </Text>
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
};