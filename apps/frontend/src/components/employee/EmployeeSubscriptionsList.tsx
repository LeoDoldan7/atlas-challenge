import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Stack,
  Group,
  Text,
  Title,
  Badge,
  Button,
  ThemeIcon,
  SimpleGrid,
  Divider
} from '@mantine/core';
import { 
  IconFileText, 
  IconEye, 
  IconUsers, 
  IconCheck, 
  IconClock, 
  IconAlertCircle 
} from '@tabler/icons-react';
import type { HealthcareSubscription } from '../../types';

interface EmployeeSubscriptionsListProps {
  subscriptions: HealthcareSubscription[];
}

export const EmployeeSubscriptionsList: React.FC<EmployeeSubscriptionsListProps> = ({ subscriptions }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'CANCELED':
        return 'red';
      case 'DEMOGRAPHIC_VERIFICATION_PENDING':
        return 'blue';
      case 'DOCUMENT_UPLOAD_PENDING':
        return 'violet';
      case 'PLAN_ACTIVATION_PENDING':
        return 'orange';
      default:
        return 'yellow';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return IconCheck;
      case 'CANCELED':
      case 'DEMOGRAPHIC_VERIFICATION_PENDING':
      case 'DOCUMENT_UPLOAD_PENDING':
      case 'PLAN_ACTIVATION_PENDING':
        return IconClock;
      default:
        return IconAlertCircle;
    }
  };

  return (
    <Card p="lg" radius="xl" shadow="md">
      <Stack gap="md">
        <Group justify="apart" align="flex-start">
          <Group gap="md">
            <ThemeIcon size={48} radius="xl" color="green" variant="light">
              <IconFileText size={24} />
            </ThemeIcon>
            <Stack gap="xs">
              <Title order={3} fw={600}>Healthcare Subscriptions</Title>
              <Text c="dimmed">Employee's healthcare subscription history</Text>
            </Stack>
          </Group>
          <Badge color="blue" variant="light" size="lg">
            {subscriptions.length} {subscriptions.length === 1 ? 'subscription' : 'subscriptions'}
          </Badge>
        </Group>

        <Divider />

        {subscriptions.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <ThemeIcon size={64} radius="xl" color="gray" variant="light">
              <IconFileText size={32} />
            </ThemeIcon>
            <Title order={4}>No Subscriptions Found</Title>
            <Text c="dimmed" ta="center" maw={400}>
              This employee doesn't have any healthcare subscriptions yet.
            </Text>
          </Stack>
        ) : (
          <Stack gap="md">
            {subscriptions.map((subscription: HealthcareSubscription) => {
              const StatusIcon = getStatusIcon(subscription.status);
              return (
                <Card 
                  key={subscription.id} 
                  p="md" 
                  radius="lg" 
                  style={{ 
                    border: '1px solid var(--mantine-color-gray-3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--mantine-color-blue-4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--mantine-color-gray-3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => navigate(`/subscriptions/${subscription.id}`)}
                >
                  <Group justify="apart" align="flex-start">
                    <Stack gap="sm" style={{ flex: 1 }}>
                      <Group gap="md">
                        <ThemeIcon 
                          size={32} 
                          radius="md" 
                          color={getStatusColor(subscription.status)} 
                          variant="light"
                        >
                          <StatusIcon size={16} />
                        </ThemeIcon>
                        <Stack gap={4}>
                          <Group gap="xs">
                            <Text fw={600}>
                              {subscription.type === 'INDIVIDUAL' ? 'Individual' : 'Family'} Plan
                            </Text>
                            <Badge 
                              color={getStatusColor(subscription.status)} 
                              variant="light" 
                              size="sm"
                            >
                              {subscription.status.toLowerCase().replace(/_/g, ' ')}
                            </Badge>
                          </Group>
                          <Text size="sm" c="dimmed">
                            {subscription.plan?.name || 'Plan details not available'}
                          </Text>
                        </Stack>
                      </Group>

                      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                        <div>
                          <Text size="xs" fw={500} c="dimmed" mb={2}>Start Date</Text>
                          <Text size="sm">{formatDate(subscription.startDate)}</Text>
                        </div>
                        {subscription.endDate && (
                          <div>
                            <Text size="xs" fw={500} c="dimmed" mb={2}>End Date</Text>
                            <Text size="sm" c="red">{formatDate(subscription.endDate)}</Text>
                          </div>
                        )}
                        <div>
                          <Text size="xs" fw={500} c="dimmed" mb={2}>Family Members</Text>
                          <Group gap="xs">
                            <IconUsers size={14} />
                            <Text size="sm">{subscription.items?.length || 0}</Text>
                          </Group>
                        </div>
                      </SimpleGrid>
                    </Stack>

                    <Button
                      variant="subtle"
                      size="sm"
                      rightSection={<IconEye size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/subscriptions/${subscription.id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Card>
  );
};