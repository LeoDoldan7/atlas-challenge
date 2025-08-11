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
import { IconUsers } from '@tabler/icons-react';
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

interface ChildrenInformationSectionProps {
  childrenCount: number;
  register: UseFormRegister<DemographicFormData>;
  errors: FieldErrors<DemographicFormData>;
}

export const ChildrenInformationSection: React.FC<ChildrenInformationSectionProps> = ({
  childrenCount,
  register,
  errors,
}) => {
  if (childrenCount === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      <Group gap="sm">
        <IconUsers size={16} style={{ opacity: 0.6 }} />
        <Title order={4} fw={600}>
          Children Information ({childrenCount} {childrenCount === 1 ? 'child' : 'children'})
        </Title>
      </Group>

      <Stack gap="md">
        {Array.from({ length: childrenCount }, (_, index) => (
          <Card key={index} p="md" radius="md" bg="gray.1">
            <Stack gap="md">
              <Title order={5} fw={500}>Child #{index + 1}</Title>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Stack gap="xs">
                  <Text size="sm" fw={500}>First Name *</Text>
                  <TextInput
                    {...register(`children.${index}.firstName`)}
                    placeholder="Enter first name"
                    error={errors.children?.[index]?.firstName?.message}
                  />
                </Stack>

                <Stack gap="xs">
                  <Text size="sm" fw={500}>Last Name *</Text>
                  <TextInput
                    {...register(`children.${index}.lastName`)}
                    placeholder="Enter last name"
                    error={errors.children?.[index]?.lastName?.message}
                  />
                </Stack>

                <Stack gap="xs">
                  <Text size="sm" fw={500}>Government ID *</Text>
                  <TextInput
                    {...register(`children.${index}.governmentId`)}
                    placeholder="e.g., SSN-123456789"
                    error={errors.children?.[index]?.governmentId?.message}
                  />
                </Stack>

                <Stack gap="xs">
                  <Text size="sm" fw={500}>Birth Date *</Text>
                  <TextInput
                    type="date"
                    {...register(`children.${index}.birthDate`)}
                    error={errors.children?.[index]?.birthDate?.message}
                  />
                </Stack>
              </SimpleGrid>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
};