import React from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Button,
  ThemeIcon
} from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';

interface SelectedFileDisplayProps {
  selectedFile: File;
  isUploading: boolean;
  onRemove: () => void;
  onUpload: () => void;
}

export const SelectedFileDisplay: React.FC<SelectedFileDisplayProps> = ({
  selectedFile,
  isUploading,
  onRemove,
  onUpload,
}) => {
  return (
    <Card p="md" radius="md" bg="gray.1">
      <Group justify="apart">
        <Group gap="md">
          <ThemeIcon size={40} radius="md" color="gray" variant="light">
            <IconFileText size={20} />
          </ThemeIcon>
          <Stack gap={4}>
            <Text fw={500}>{selectedFile.name}</Text>
            <Text size="sm" c="dimmed">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
            </Text>
          </Stack>
        </Group>
        <Group gap="xs">
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={isUploading}
            radius="xl"
          >
            Remove
          </Button>
          <Button
            onClick={onUpload}
            loading={isUploading}
            size="sm"
            radius="xl"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </Group>
      </Group>
    </Card>
  );
};