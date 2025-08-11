import React from 'react';
import { Card, Stack, Group, Title, Text, Select } from '@mantine/core';
import type { Employee } from '../../types';

interface EmployeeSelectionProps {
  employees: Employee[];
  selectedEmployeeId: string;
  onEmployeeChange: (employeeId: string) => void;
  error?: string;
}

export const EmployeeSelection: React.FC<EmployeeSelectionProps> = ({
  employees,
  selectedEmployeeId,
  onEmployeeChange,
  error,
}) => {
  return (
    <Card shadow="lg" padding="lg">
      <Stack gap="md">
        <Group gap="xs">
          <div style={{ width: 8, height: 8, backgroundColor: 'var(--mantine-color-blue-6)', borderRadius: '50%' }} />
          <Title order={3}>Employee Selection</Title>
        </Group>
        <Text c="dimmed">Select the employee for this subscription</Text>

        <Select
          label="Employee *"
          placeholder="Search and select an employee..."
          data={employees.map((employee: Employee) => ({
            value: employee.id,
            label: `${employee.demographic.firstName} ${employee.demographic.lastName}`,
          }))}
          value={selectedEmployeeId}
          onChange={(value) => onEmployeeChange(value || '')}
          error={error}
          searchable
        />
      </Stack>
    </Card>
  );
};