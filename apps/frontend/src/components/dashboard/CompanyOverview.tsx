import React from 'react';
import { Card, Group, ThemeIcon, Stack, Title, Text } from '@mantine/core';
import { IconBuilding } from '@tabler/icons-react';

interface CompanyOverviewProps {
  companyName: string;
  companyId: string;
}

export const CompanyOverview: React.FC<CompanyOverviewProps> = ({ 
  companyName, 
  companyId 
}) => {
  return (
    <Card shadow="xl" padding="xl">
      <Group gap="md">
        <ThemeIcon size="xl" variant="light" color="blue">
          <IconBuilding size={32} />
        </ThemeIcon>
        <Stack gap="xs">
          <Title order={2}>{companyName}</Title>
          <Text c="dimmed">Company ID: {companyId}</Text>
        </Stack>
      </Group>
    </Card>
  );
};