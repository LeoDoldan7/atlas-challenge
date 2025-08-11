import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Stack, 
  Text, 
  Title, 
  Loader, 
  ThemeIcon, 
  Button, 
  SimpleGrid,
  Group,
  Badge
} from '@mantine/core';
import { 
  IconActivity, 
  IconPlus, 
  IconArrowRight, 
  IconUser, 
  IconCalendar, 
  IconBuilding, 
  IconCoin 
} from '@tabler/icons-react';
import type { HealthcareSubscription, ApiError } from '../../types';

interface SubscriptionsContentProps {
  subscriptions: HealthcareSubscription[];
  loading: boolean;
  error: ApiError | null;
  onNewSubscription: () => void;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}

export const SubscriptionsContent: React.FC<SubscriptionsContentProps> = ({
  subscriptions,
  loading,
  error,
  onNewSubscription,
  formatDate,
  getStatusColor,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card p="xl" radius="xl" shadow="lg" style={{ maxWidth: 600, margin: '0 auto' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text size="xl" fw={500}>Loading subscriptions...</Text>
        </Stack>
      </Card>
    );
  }

  if (error) {
    return (
      <Card p="xl" radius="xl" shadow="lg" style={{ maxWidth: 600, margin: '0 auto' }}>
        <Stack align="center" gap="md">
          <ThemeIcon size={64} radius="xl" color="red">
            <IconActivity size={32} />
          </ThemeIcon>
          <Title order={2}>Failed to load subscriptions</Title>
          <Text ta="center" c="dimmed" maw={400}>
            {error.message || 'An error occurred while fetching subscriptions'}
          </Text>
          <Button onClick={() => window.location.reload()} radius="xl">
            Try Again
          </Button>
        </Stack>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card p="xl" radius="xl" shadow="lg" style={{ maxWidth: 600, margin: '0 auto' }}>
        <Stack align="center" gap="lg">
          <ThemeIcon size={80} radius="xl" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconActivity size={40} />
          </ThemeIcon>
          <Title order={2} ta="center">Ready to get started?</Title>
          <Text ta="center" c="dimmed" size="lg" maw={500}>
            Create your first healthcare subscription and start managing employee benefits with ease.
          </Text>
          <Button
            onClick={onNewSubscription}
            size="lg"
            radius="xl"
            leftSection={<IconPlus size={20} />}
            rightSection={<IconArrowRight size={20} />}
          >
            Create your first subscription
          </Button>
        </Stack>
      </Card>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
      {subscriptions.map((subscription: HealthcareSubscription) => (
        <Card
          key={subscription.id}
          p="lg"
          radius="xl"
          shadow="md"
          style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
          onClick={() => navigate(`/subscriptions/${subscription.id}`)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = 'var(--mantine-shadow-xl)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
          }}
        >
          <Stack gap="md">
            <Group justify="apart">
              <Title order={4} fw={600}>
                {subscription.employee?.demographic.firstName} {subscription.employee?.demographic.lastName} – {subscription.plan?.name || 'Healthcare Plan'}
              </Title>
              <Group gap="xs">
                <Badge color={getStatusColor(subscription.status)} variant="light">
                  {subscription.status.toLowerCase()}
                </Badge>
                <IconArrowRight size={16} style={{ opacity: 0.6 }} />
              </Group>
            </Group>

            <Stack gap="xs">
              <Group gap="sm">
                <IconUser size={16} style={{ opacity: 0.6 }} />
                <Text size="sm" c="dimmed">
                  {subscription.type === 'INDIVIDUAL' ? 'Individual' : 'Family'} Plan
                </Text>
              </Group>
              
              <Group gap="sm">
                <IconCalendar size={16} style={{ opacity: 0.6 }} />
                <Text size="sm" c="dimmed">Started {formatDate(subscription.startDate)}</Text>
              </Group>
              
              <Group gap="sm">
                <IconBuilding size={16} style={{ opacity: 0.6 }} />
                <Text size="sm" c="dimmed">ID: {subscription.id}</Text>
              </Group>

              <Group gap="sm">
                <IconCoin size={16} style={{ opacity: 0.6 }} />
                <Text size="sm" c="dimmed">
                  Last payment: {subscription.lastPaymentAt ? formatDate(subscription.lastPaymentAt) : 'Never'}
                </Text>
              </Group>

              {subscription.endDate && (
                <Group gap="sm">
                  <IconCalendar size={16} style={{ opacity: 0.6 }} />
                  <Text size="sm" c="red">Ends {formatDate(subscription.endDate)}</Text>
                </Group>
              )}
            </Stack>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
};