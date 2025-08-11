import React from 'react';
import { Card, Stack, Alert, Text } from '@mantine/core';
import { ApolloError } from '@apollo/client';

interface ErrorStateProps {
  error: ApolloError;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  return (
    <Card shadow="xl" padding="xl">
      <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
        <Alert color="red" title="Failed to load dashboard" style={{ textAlign: 'center' }}>
          <Text>
            {error.message || 'An error occurred while fetching company statistics'}
          </Text>
        </Alert>
      </Stack>
    </Card>
  );
};