import React from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Title,
  ThemeIcon
} from '@mantine/core';
import { IconFileText, IconCheck } from '@tabler/icons-react';
import type { HealthcareSubscriptionFile } from '../../types';

interface SubmittedDocumentsListProps {
  files: HealthcareSubscriptionFile[] | null;
}

export const SubmittedDocumentsList: React.FC<SubmittedDocumentsListProps> = ({ files }) => {
  if (!files || files.length === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      <Title order={5} fw={500}>Submitted Documents:</Title>
      <Stack gap="xs">
        {files.map((file: HealthcareSubscriptionFile) => (
          <Card key={file.id} p="md" radius="md" bg="gray.1">
            <Group gap="md">
              <ThemeIcon size={40} radius="md" color="gray" variant="light">
                <IconFileText size={20} />
              </ThemeIcon>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text fw={500}>{file.originalName}</Text>
                <Text size="sm" c="dimmed">
                  {(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB • {file.mimeType}
                </Text>
              </Stack>
              <ThemeIcon size={24} color="green" variant="light">
                <IconCheck size={16} />
              </ThemeIcon>
            </Group>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
};