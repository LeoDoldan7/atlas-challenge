import React from 'react';
import { Card, Stack, Group, ThemeIcon, Text } from '@mantine/core';
import { IconUser, IconMail, IconCalendar } from '@tabler/icons-react';
import type { Employee } from '../../types';
import { EmployeeWalletInfo } from './EmployeeWalletInfo';
import { EmployeeStatusInfo } from './EmployeeStatusInfo';

interface EmployeeCardProps {
  employee: Employee;
  onEmployeeClick: (employeeId: string) => void;
  formatDate: (dateString: string) => string;
  formatCurrency: (cents: string) => string;
  getWalletStatus: (employee: Employee) => string;
  getMaritalStatusColor: (status: string) => string;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onEmployeeClick,
  formatDate,
  formatCurrency,
  getWalletStatus,
  getMaritalStatusColor,
}) => {
  const walletStatus = getWalletStatus(employee);

  return (
    <Card
      p="lg"
      radius="xl"
      shadow="md"
      style={{ 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--mantine-shadow-lg)';
        e.currentTarget.style.borderColor = 'var(--mantine-color-blue-3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
      onClick={() => onEmployeeClick(employee.id)}
    >
      <Stack gap="md">
        <Group gap="md">
          <ThemeIcon size={40} radius="xl" color="blue" variant="light">
            <IconUser size={20} />
          </ThemeIcon>
          <Stack gap={4} style={{ flex: 1 }}>
            <Text fw={600} size="lg">
              {employee.demographic.firstName} {employee.demographic.lastName}
            </Text>
            <Text size="sm" c="dimmed">
              Employee ID: {employee.id}
            </Text>
          </Stack>
        </Group>

        <Stack gap="sm">
          <Group gap="xs">
            <IconMail size={16} style={{ opacity: 0.6 }} />
            <Text size="sm">{employee.email}</Text>
          </Group>

          <Group gap="xs">
            <IconCalendar size={16} style={{ opacity: 0.6 }} />
            <Text size="sm">Born: {formatDate(employee.birthDate)}</Text>
          </Group>

          <EmployeeWalletInfo
            employee={employee}
            formatCurrency={formatCurrency}
            walletStatus={walletStatus}
          />

          <EmployeeStatusInfo
            employee={employee}
            formatDate={formatDate}
            getMaritalStatusColor={getMaritalStatusColor}
          />
        </Stack>
      </Stack>
    </Card>
  );
};