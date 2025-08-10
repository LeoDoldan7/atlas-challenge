import React from "react";
import { useNavigate } from "react-router-dom";
import {
  IconPlus,
  IconActivity,
  IconArrowRight,
  IconUser,
  IconCalendar,
  IconBuilding,
} from "@tabler/icons-react";

import {
  Button,
  Card,
  Stack,
  Group,
  Text,
  Title,
  Container,
  Badge,
  Loader,
  SimpleGrid,
  ThemeIcon,
} from "@mantine/core";
import { useSubscriptions } from "../hooks/useSubscriptions";
import type { HealthcareSubscription } from "../types";

const Subscriptions: React.FC = () => {
  const navigate = useNavigate();
  const { subscriptions, loading, error } = useSubscriptions();
  const handleNewSubscription = () => navigate("/subscriptions/new");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'CANCELED':
        return 'red';
      case 'TERMINATED':
        return 'gray';
      default:
        return 'yellow';
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Hero Section */}
        <Stack align="center" gap="md" py="xl">
          <Title order={1} size={48} ta="center" fw={700} c="dark">
            Healthcare Subscriptions
          </Title>
          <Text size="xl" ta="center" c="dimmed" maw={600}>
            Manage, monitor, and analyze your organization's healthcare benefits from a single, modern dashboard.
          </Text>

          <Button
            onClick={handleNewSubscription}
            size="lg"
            radius="xl"
            leftSection={<IconPlus size={20} />}
            mt="md"
          >
            Create New Subscription
          </Button>
        </Stack>

        {/* Main Content */}
        {loading ? (
          <Card p="xl" radius="xl" shadow="lg" style={{ maxWidth: 600, margin: '0 auto' }}>
            <Stack align="center" gap="md">
              <Loader size="xl" />
              <Text size="xl" fw={500}>Loading subscriptions...</Text>
            </Stack>
          </Card>
        ) : error ? (
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
        ) : subscriptions.length === 0 ? (
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
                onClick={handleNewSubscription}
                size="lg"
                radius="xl"
                leftSection={<IconPlus size={20} />}
                rightSection={<IconArrowRight size={20} />}
              >
                Create your first subscription
              </Button>
            </Stack>
          </Card>
        ) : (
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
                      {subscription.type === 'INDIVIDUAL' ? 'Individual' : 'Family'} Plan
                    </Title>
                    <Group gap="xs">
                      <Badge color={getStatusColor(subscription.status)} variant="light">
                        {subscription.status.toLowerCase()}
                      </Badge>
                      <IconArrowRight size={16} style={{ opacity: 0.6 }} />
                    </Group>
                  </Group>
                  
                  <Text c="dimmed">
                    {subscription.plan?.name || 'Healthcare Plan'}
                  </Text>

                  <Stack gap="xs">
                    {subscription.employee && (
                      <Group gap="sm">
                        <IconUser size={16} style={{ opacity: 0.6 }} />
                        <Text size="sm" c="dimmed">
                          {subscription.employee.demographic.firstName} {subscription.employee.demographic.lastName}
                        </Text>
                      </Group>
                    )}
                    
                    <Group gap="sm">
                      <IconCalendar size={16} style={{ opacity: 0.6 }} />
                      <Text size="sm" c="dimmed">Started {formatDate(subscription.startDate)}</Text>
                    </Group>
                    
                    <Group gap="sm">
                      <IconBuilding size={16} style={{ opacity: 0.6 }} />
                      <Text size="sm" c="dimmed">ID: {subscription.id}</Text>
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
        )}
      </Stack>
    </Container>
  );
};

export default Subscriptions;
