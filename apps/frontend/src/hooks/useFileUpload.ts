import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { UPLOAD_FILES_MUTATION } from '../lib/queries';

interface UseFileUploadProps {
  subscriptionId: string;
  onSuccess: () => void;
}

export const useFileUpload = ({ subscriptionId, onSuccess }: UseFileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFiles] = useMutation(UPLOAD_FILES_MUTATION);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data:mime/type;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const validateFile = (file: File): boolean => {
    // Validate file size (5MB max to account for base64 overhead)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      notifications.show({
        title: 'Error',
        message: 'File size must be less than 5MB',
        color: 'red',
        icon: React.createElement(IconX, { size: 16 }),
      });
      return false;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      notifications.show({
        title: 'Error',
        message: 'File type not allowed. Please upload PDF, JPG, PNG, GIF, or Word documents.',
        color: 'red',
        icon: React.createElement(IconX, { size: 16 }),
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Convert file to base64
      const base64Data = await convertFileToBase64(selectedFile);

      // Call the mutation
      await uploadFiles({
        variables: {
          uploadFilesInput: {
            subscriptionId,
            files: [{
              filename: selectedFile.name,
              mimetype: selectedFile.type,
              data: base64Data,
            }],
          },
        },
      });

      notifications.show({
        title: 'Success',
        message: 'File uploaded successfully! Subscription status updated.',
        color: 'green',
        icon: React.createElement(IconCheck, { size: 16 }),
      });
      
      onSuccess();
      
      // Reset file selection
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file. Please try again.';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: React.createElement(IconX, { size: 16 }),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return {
    selectedFile,
    isUploading,
    handleFileSelect,
    handleFileUpload,
    removeSelectedFile,
  };
};