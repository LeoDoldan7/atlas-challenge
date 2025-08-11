import React from 'react';
import { Card, Stack, Text, Grid } from '@mantine/core';

interface TotalCostSummaryProps {
  totalCost: number;
  companyPays: number;
  employeePays: number;
}

export const TotalCostSummary: React.FC<TotalCostSummaryProps> = ({
  totalCost,
  companyPays,
  employeePays,
}) => {
  return (
    <Card bg="gray.1" padding="md" radius="md">
      <Stack gap="md">
        <Text fw={600} size="lg">Monthly Total</Text>
        <Grid>
          <Grid.Col span={4}>
            <Stack gap="xs" align="center">
              <Text size="sm" c="dimmed">Total Cost</Text>
              <Text fw={700} size="xl">
                ${totalCost.toFixed(2)}
              </Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={4}>
            <Stack gap="xs" align="center">
              <Text size="sm" c="dimmed">Company Pays</Text>
              <Text fw={700} size="xl" c="blue">
                ${companyPays.toFixed(2)}
              </Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={4}>
            <Stack gap="xs" align="center">
              <Text size="sm" c="dimmed">Employee Pays</Text>
              <Text fw={700} size="xl" c="red">
                ${employeePays.toFixed(2)}
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
};