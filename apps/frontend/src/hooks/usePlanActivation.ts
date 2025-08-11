import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { ACTIVATE_PLAN_MUTATION } from '../lib/queries';

interface UsePlanActivationProps {
  subscriptionId: string;
  onSuccess: () => void;
}

export const usePlanActivation = ({ subscriptionId, onSuccess }: UsePlanActivationProps) => {
  const [isActivating, setIsActivating] = useState(false);
  const [activatePlan] = useMutation(ACTIVATE_PLAN_MUTATION);

  const handlePlanActivation = async () => {
    setIsActivating(true);
    try {
      await activatePlan({
        variables: {
          activatePlanInput: {
            subscriptionId,
          },
        },
      });

      notifications.show({
        title: 'Success',
        message: 'Plan activated successfully! Your subscription is now active.',
        color: 'green',
        icon: React.createElement(IconCheck, { size: 16 }),
      });
      
      onSuccess();
      
    } catch (error: unknown) {
      console.error('Error activating plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate plan. Please try again.';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: React.createElement(IconX, { size: 16 }),
      });
    } finally {
      setIsActivating(false);
    }
  };

  return {
    isActivating,
    handlePlanActivation,
  };
};