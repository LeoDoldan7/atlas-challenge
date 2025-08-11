import React from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Title,
  TextInput,
  SimpleGrid
} from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';

interface DemographicFormData {
  spouse?: {
    firstName: string;
    lastName: string;
    governmentId: string;
    birthDate: string;
  };
  children: Array<{
    firstName: string;
    lastName: string;
    governmentId: string;
    birthDate: string;
  }>;
}

interface SpouseInformationSectionProps {
  spouseCount: number;
  register: UseFormRegister<DemographicFormData>;
  errors: FieldErrors<DemographicFormData>;
}

export const SpouseInformationSection: React.FC<SpouseInformationSectionProps> = ({
  spouseCount,
  register,
  errors,
}) => {
  if (spouseCount === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      <Group gap="sm">
        <IconUser size={16} style={{ opacity: 0.6 }} />
        <Title order={4} fw={600}>Spouse Information</Title>
      </Group>

      <Card p="md" radius="md" bg="gray.1">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Stack gap="xs">
            <Text size="sm" fw={500}>First Name *</Text>
            <TextInput
              {...register('spouse.firstName')}
              placeholder="Enter first name"
              error={errors.spouse?.firstName?.message}
            />
          </Stack>

          <Stack gap="xs">
            <Text size="sm" fw={500}>Last Name *</Text>
            <TextInput
              {...register('spouse.lastName')}
              placeholder="Enter last name"
              error={errors.spouse?.lastName?.message}
            />
          </Stack>

          <Stack gap="xs">
            <Text size="sm" fw={500}>Government ID *</Text>
            <TextInput
              {...register('spouse.governmentId')}
              placeholder="e.g., SSN-123456789"
              error={errors.spouse?.governmentId?.message}
            />
          </Stack>

          <Stack gap="xs">
            <Text size="sm" fw={500}>Birth Date *</Text>
            <TextInput
              type="date"
              {...register('spouse.birthDate')}
              error={errors.spouse?.birthDate?.message}
            />
          </Stack>
        </SimpleGrid>
      </Card>
    </Stack>
  );
};