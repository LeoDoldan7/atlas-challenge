import React from 'react';
import { Group, Badge, Text } from '@mantine/core';
import type { Employee } from '../../types';

interface EmployeeStatusInfoProps {
  employee: Employee;
  formatDate: (dateString: string) => string;
  getMaritalStatusColor: (status: string) => string;
}

export const EmployeeStatusInfo: React.FC<EmployeeStatusInfoProps> = ({
  employee,
  formatDate,
  getMaritalStatusColor,
}) => {
  return (
    <Group justify="space-between" mt="xs">
      <Badge 
        color={getMaritalStatusColor(employee.maritalStatus)} 
        variant="light"
        size="sm"
      >
        {employee.maritalStatus.toLowerCase().replace('_', ' ')}
      </Badge>
      <Text size="xs" c="dimmed">
        Joined: {formatDate(employee.createdAt)}
      </Text>
    </Group>
  );
};