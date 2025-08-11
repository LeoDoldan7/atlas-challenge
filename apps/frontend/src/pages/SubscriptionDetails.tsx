import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  IconArrowLeft,
  IconFileText,
} from '@tabler/icons-react';

import {
  Button,
  Stack,
  Group,
  Text,
  Title,
  Container,
  Loader,
  Breadcrumbs,
  Anchor,
  ThemeIcon,
  Card,
} from '@mantine/core';
import { GET_SUBSCRIPTION_STATUS_QUERY } from '../lib/queries';
import type { HealthcareSubscription } from '../types';
import { useSubscriptionWorkflow } from '../hooks/useSubscriptionWorkflow';
import { SubscriptionOverviewCard } from '../components/subscription/SubscriptionOverviewCard';
import { DemographicVerificationCard } from '../components/subscription/DemographicVerificationCard';
import { DocumentUploadCard } from '../components/subscription/DocumentUploadCard';
import { PlanActivationCard } from '../components/subscription/PlanActivationCard';
import { SubscriptionStatusCards } from '../components/subscription/SubscriptionStatusCards';
import { EnrollmentProgressCard } from '../components/subscription/EnrollmentProgressCard';
import { CostBreakdownCard } from '../components/subscription/CostBreakdownCard';

const SubscriptionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data, loading, error, refetch } = useQuery<{ getSubscriptionStatus: HealthcareSubscription }>(GET_SUBSCRIPTION_STATUS_QUERY, {
    variables: { subscriptionId: id! },
    skip: !id,
  });

  const subscription = data?.getSubscriptionStatus;
  
  const { currentStep, subscriptionItemCounts } = useSubscriptionWorkflow(subscription);
  const { spouseCount, childrenCount } = subscriptionItemCounts;

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Card p="xl" radius="xl" shadow="lg" style={{ maxWidth: 600, margin: '0 auto' }}>
          <Stack align="center" gap="md">
            <Loader size="xl" />
            <Text size="xl" fw={500}>Loading subscription details...</Text>
          </Stack>
        </Card>
      </Container>
    );
  }

  if (error || !subscription) {
    return (
      <Container size="lg" py="xl">
        <Card p="xl" radius="xl" shadow="lg" style={{ maxWidth: 600, margin: '0 auto' }}>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="red">
              <IconFileText size={32} />
            </ThemeIcon>
            <Title order={2}>Subscription Not Found</Title>
            <Text ta="center" c="dimmed" maw={400}>
              The subscription you're looking for doesn't exist or couldn't be loaded.
            </Text>
            <Button
              onClick={() => navigate('/subscriptions')}
              leftSection={<IconArrowLeft size={16} />}
              radius="xl"
            >
              Back to Subscriptions
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header with Breadcrumbs */}
        <Stack gap="md">
          <Breadcrumbs>
            <Anchor href="/subscriptions" c="dimmed">
              Subscriptions
            </Anchor>
            <Text fw={500}>Details</Text>
          </Breadcrumbs>

          <Group justify="apart">
            <Stack gap="xs">
              <Title order={1} size={36} fw={700}>
                Subscription Details
              </Title>
              <Text size="lg" c="dimmed">
                {subscription.type === 'INDIVIDUAL' ? 'Individual' : 'Family'} healthcare subscription
              </Text>
            </Stack>
            <Button
              onClick={() => navigate('/subscriptions')}
              variant="outline"
              radius="xl"
              leftSection={<IconArrowLeft size={16} />}
            >
              Back
            </Button>
          </Group>
        </Stack>

        <Container size="sm" p={0}>
          <Stack gap="lg">
            <SubscriptionOverviewCard 
              subscription={subscription} 
              currentStep={currentStep} 
            />

            {currentStep === 'DEMOGRAPHIC_VERIFICATION_PENDING' && (
              <DemographicVerificationCard
                subscriptionId={id!}
                spouseCount={spouseCount}
                childrenCount={childrenCount}
                onSuccess={() => refetch()}
              />
            )}

            {currentStep === 'DOCUMENT_UPLOAD_PENDING' && (
              <DocumentUploadCard
                subscriptionId={id!}
                onSuccess={() => refetch()}
              />
            )}

            {currentStep === 'PLAN_ACTIVATION_PENDING' && (
              <PlanActivationCard
                subscriptionId={id!}
                files={subscription.files || null}
                onSuccess={() => refetch()}
              />
            )}

            <CostBreakdownCard 
              subscription={subscription} 
              spouseCount={spouseCount}
              childrenCount={childrenCount}
            />

            <SubscriptionStatusCards subscription={subscription} />

            <EnrollmentProgressCard subscription={subscription} />
          </Stack>
        </Container>
      </Stack>
    </Container>
  );
};

export default SubscriptionDetails;