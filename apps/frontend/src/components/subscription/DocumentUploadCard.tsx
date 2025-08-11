import React from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Title,
  Alert
} from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { FileUploadArea } from './FileUploadArea';
import { SelectedFileDisplay } from './SelectedFileDisplay';

interface DocumentUploadCardProps {
  subscriptionId: string;
  onSuccess: () => void;
}

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  subscriptionId,
  onSuccess,
}) => {
  const fileUpload = useFileUpload({
    subscriptionId,
    onSuccess,
  });

  return (
    <Card p="lg" radius="xl" shadow="md">
      <Stack gap="lg">
        <Group gap="sm">
          <IconUpload size={20} />
          <Title order={3} fw={600}>Document Upload</Title>
        </Group>
        
        <Text c="dimmed">
          Please upload the required documents to proceed with your subscription.
        </Text>

        <Stack gap="lg">
          <FileUploadArea
            onFileSelect={fileUpload.handleFileSelect}
            isUploading={fileUpload.isUploading}
          />

          {fileUpload.selectedFile && (
            <SelectedFileDisplay
              selectedFile={fileUpload.selectedFile}
              isUploading={fileUpload.isUploading}
              onRemove={fileUpload.removeSelectedFile}
              onUpload={fileUpload.handleFileUpload}
            />
          )}

          <Alert color="blue" radius="md">
            <Stack gap="xs">
              <Text fw={500}>Required Documents:</Text>
              <Text size="sm">
                • Government-issued ID for all family members<br />
                • Proof of employment<br />
                • Previous insurance documentation (if applicable)
              </Text>
            </Stack>
          </Alert>
        </Stack>
      </Stack>
    </Card>
  );
};