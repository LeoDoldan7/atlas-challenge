import React from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Title,
  Badge,
  ThemeIcon,
  SimpleGrid,
  Divider
} from '@mantine/core';
import { IconUser, IconMail, IconCalendar } from '@tabler/icons-react';
import type { Employee } from '../../types';

interface EmployeeInformationCardProps {
  employee: Employee;
}

export const EmployeeInformationCard: React.FC<EmployeeInformationCardProps> = ({ employee }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMaritalStatusColor = (status: string) => {
    switch (status) {
      case 'MARRIED':
        return 'blue';
      case 'SINGLE':
        return 'green';
      case 'DIVORCED':
        return 'orange';
      case 'SEPARATED':
        return 'yellow';
      case 'WIDOWED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  return (
    <Card p="lg" radius="xl" shadow="md">
      <Stack gap="md">
        <Group gap="md">
          <ThemeIcon size={48} radius="xl" color="blue" variant="light">
            <IconUser size={24} />
          </ThemeIcon>
          <Stack gap="xs">
            <Title order={3} fw={600}>Employee Information</Title>
            <Text c="dimmed">Personal details and contact information</Text>
          </Stack>
        </Group>

        <Divider />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Stack gap="sm">
            <div>
              <Text size="sm" fw={500} c="dimmed" mb={4}>Full Name</Text>
              <Text size="lg">{employee.demographic.firstName} {employee.demographic.lastName}</Text>
            </div>
            
            <div>
              <Text size="sm" fw={500} c="dimmed" mb={4}>Employee ID</Text>
              <Text size="lg">{employee.id}</Text>
            </div>

            <div>
              <Text size="sm" fw={500} c="dimmed" mb={4}>Email</Text>
              <Group gap="xs">
                <IconMail size={16} style={{ opacity: 0.6 }} />
                <Text size="lg">{employee.email}</Text>
              </Group>
            </div>
          </Stack>

          <Stack gap="sm">
            <div>
              <Text size="sm" fw={500} c="dimmed" mb={4}>Birth Date</Text>
              <Group gap="xs">
                <IconCalendar size={16} style={{ opacity: 0.6 }} />
                <Text size="lg">{formatDate(employee.birthDate)}</Text>
              </Group>
            </div>

            <div>
              <Text size="sm" fw={500} c="dimmed" mb={4}>Marital Status</Text>
              <Badge 
                color={getMaritalStatusColor(employee.maritalStatus)} 
                variant="light"
                size="lg"
              >
                {employee.maritalStatus.toLowerCase().replace('_', ' ')}
              </Badge>
            </div>

            <div>
              <Text size="sm" fw={500} c="dimmed" mb={4}>Join Date</Text>
              <Text size="lg">{formatDate(employee.createdAt)}</Text>
            </div>
          </Stack>
        </SimpleGrid>
      </Stack>
    </Card>
  );
};