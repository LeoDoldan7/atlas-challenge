import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from '@apollo/client';
import {
  IconPlus,
  IconCreditCard,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

import {
  Button,
  Stack,
  Group,
  Text,
  Title,
  Container,
} from "@mantine/core";
import { notifications } from '@mantine/notifications';
import { useSubscriptions } from "../hooks/useSubscriptions";
import { PROCESS_COMPANY_PAYMENTS_MUTATION } from '../lib/queries';
import { SubscriptionsContent } from '../components/subscription';
import type { ProcessPaymentsResponse } from "../types";

const Subscriptions: React.FC = () => {
  const navigate = useNavigate();
  const { subscriptions, loading, error, refetch } = useSubscriptions();
  const [isProcessingPayments, setIsProcessingPayments] = useState(false);
  
  const handleNewSubscription = () => navigate("/subscriptions/new");
  
  const [processPayments] = useMutation<ProcessPaymentsResponse>(PROCESS_COMPANY_PAYMENTS_MUTATION);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (cents: string) => {
    const dollars = parseInt(cents) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(dollars);
  };

  const handleProcessPayments = async () => {
    setIsProcessingPayments(true);
    try {
      const result = await processPayments({
        variables: {
          processPaymentsInput: {
            companyId: '1'
          }
        }
      });

      const paymentData = result.data?.processCompanyPayments;
      if (paymentData) {
        const { overallSuccess, totalAmountProcessed, totalSuccessfulPayments, totalFailedPayments, totalPartialFailures } = paymentData;
        
        if (overallSuccess) {
          notifications.show({
            title: 'All Payments Processed Successfully',
            message: `Successfully processed ${formatCurrency(totalAmountProcessed)} in payments for ${totalSuccessfulPayments} employees`,
            color: 'green',
            icon: <IconCheck size={16} />,
          });
        } else {
          // Show detailed results for partial success/failures
          const successCount = totalSuccessfulPayments;
          const partialCount = totalPartialFailures;
          const failureCount = totalFailedPayments;
          
          let message = `Processed ${formatCurrency(totalAmountProcessed)} in payments. `;
          message += `${successCount} successful`;
          if (partialCount > 0) message += `, ${partialCount} partial`;
          if (failureCount > 0) message += `, ${failureCount} failed`;
          
          notifications.show({
            title: 'Payments Processed with Issues',
            message,
            color: totalSuccessfulPayments > 0 ? 'yellow' : 'red',
            icon: totalSuccessfulPayments > 0 ? <IconCheck size={16} /> : <IconX size={16} />,
          });
        }
        
        // Refresh subscription data to show updated payment status
        await refetch();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payments. Please try again.';
      notifications.show({
        title: 'Payment Failed',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setIsProcessingPayments(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'CANCELLED':
      case 'TERMINATED':
        return 'red';
      case 'PENDING':
        return 'blue';
      case 'DRAFT':
        return 'gray';
      case 'EXPIRED':
        return 'orange';
      default:
        return 'yellow';
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Stack align="center" gap="md" py="xl">
          <Title order={1} size={48} ta="center" fw={700} c="dark">
            Healthcare Subscriptions
          </Title>
          <Text size="xl" ta="center" c="dimmed" maw={600}>
            Manage, monitor, and analyze your organization's healthcare benefits from a single, modern dashboard.
          </Text>

          <Group gap="md" mt="md">
            <Button
              onClick={handleNewSubscription}
              size="lg"
              radius="xl"
              leftSection={<IconPlus size={20} />}
            >
              Create New Subscription
            </Button>
            
            <Button
              onClick={handleProcessPayments}
              loading={isProcessingPayments}
              leftSection={<IconCreditCard size={20} />}
              size="lg"
              radius="xl"
              color="green"
            >
              {isProcessingPayments ? 'Processing...' : 'Pay All Subscriptions'}
            </Button>
          </Group>
        </Stack>

        <SubscriptionsContent
          subscriptions={subscriptions}
          loading={loading}
          error={error}
          onNewSubscription={handleNewSubscription}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
        />
      </Stack>
    </Container>
  );
};

export default Subscriptions;
