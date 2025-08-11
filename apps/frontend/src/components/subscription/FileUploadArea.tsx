import React from 'react';
import {
  Card,
  Stack,
  Text,
  Title,
  Button,
  ThemeIcon
} from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';

interface FileUploadAreaProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileSelect,
  isUploading,
}) => {
  return (
    <Card
      p="xl"
      radius="md"
      style={{
        border: '2px dashed var(--mantine-color-gray-4)',
        backgroundColor: 'transparent',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--mantine-color-gray-6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--mantine-color-gray-4)';
      }}
    >
      <Stack align="center" gap="md">
        <ThemeIcon size={48} radius="xl" color="gray" variant="light">
          <IconUpload size={24} />
        </ThemeIcon>
        <Title order={4}>Upload Document</Title>
        <Text c="dimmed" size="sm">
          Accepted formats: PDF, JPG, PNG, GIF, Word documents (max 5MB)
        </Text>
        <input
          id="file-input"
          type="file"
          onChange={onFileSelect}
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
          style={{ display: 'none' }}
        />
        <Button
          onClick={() => document.getElementById('file-input')?.click()}
          radius="xl"
          disabled={isUploading}
        >
          Choose File
        </Button>
      </Stack>
    </Card>
  );
};