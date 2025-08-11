import React from 'react';
import { Card, Stack, Group, Title, Text, Select } from '@mantine/core';

interface Plan {
  id: string;
  name: string;
}

interface PlanSelectionProps {
  plans: Plan[];
  selectedPlanId: string;
  onPlanChange: (planId: string | null) => void;
  error?: string;
}

export const PlanSelection: React.FC<PlanSelectionProps> = ({
  plans,
  selectedPlanId,
  onPlanChange,
  error,
}) => {
  return (
    <Card shadow="lg" padding="lg">
      <Stack gap="md">
        <Group gap="xs">
          <div style={{ width: 8, height: 8, backgroundColor: 'var(--mantine-color-green-6)', borderRadius: '50%' }} />
          <Title order={3}>Healthcare Plan</Title>
        </Group>
        <Text c="dimmed">Select the healthcare plan for this subscription</Text>

        <Select
          label="Healthcare Plan *"
          placeholder="Select a healthcare plan..."
          data={plans.map((plan) => ({
            value: plan.id,
            label: plan.name,
          }))}
          value={selectedPlanId}
          onChange={onPlanChange}
          error={error}
        />
      </Stack>
    </Card>
  );
};