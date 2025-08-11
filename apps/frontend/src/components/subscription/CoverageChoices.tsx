import React from 'react';
import { Card, Stack, Group, Title, Text, Checkbox, ActionIcon } from '@mantine/core';
import { IconMinus, IconPlus } from '@tabler/icons-react';

interface CoverageChoicesProps {
  spouseIncluded: boolean;
  childrenCount: number;
  onSpouseChange: (checked: boolean) => void;
  onChildrenCountChange: (count: number) => void;
}

export const CoverageChoices: React.FC<CoverageChoicesProps> = ({
  spouseIncluded,
  childrenCount,
  onSpouseChange,
  onChildrenCountChange,
}) => {
  const adjustChildrenCount = (delta: number) => {
    const newCount = Math.max(0, Math.min(7, childrenCount + delta));
    onChildrenCountChange(newCount);
  };

  return (
    <Card shadow="lg" padding="lg">
      <Stack gap="md">
        <Group gap="xs">
          <div style={{ width: 8, height: 8, backgroundColor: 'var(--mantine-color-teal-6)', borderRadius: '50%' }} />
          <Title order={3}>Coverage Choices</Title>
        </Group>
        <Text c="dimmed">Configure family coverage options</Text>

        <Stack gap="lg">
          <Card bg="gray.0" padding="md">
            <Checkbox
              label="Spouse included"
              checked={spouseIncluded}
              onChange={(event) => onSpouseChange(event.currentTarget.checked)}
            />
          </Card>

          <Card bg="gray.0" padding="md">
            <Stack gap="md">
              <Text fw={500}>Number of children</Text>
              <Group justify="center">
                <ActionIcon
                  size="xl"
                  variant="outline"
                  radius="xl"
                  onClick={() => adjustChildrenCount(-1)}
                  disabled={childrenCount <= 0}
                >
                  <IconMinus size={20} />
                </ActionIcon>

                <Text size="xl" fw={700} w={60} ta="center">
                  {childrenCount}
                </Text>

                <ActionIcon
                  size="xl"
                  variant="outline"
                  radius="xl"
                  onClick={() => adjustChildrenCount(1)}
                  disabled={childrenCount >= 7}
                >
                  <IconPlus size={20} />
                </ActionIcon>
              </Group>
              <Text size="sm" c="dimmed" ta="center">Maximum 7 children allowed</Text>
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </Card>
  );
};