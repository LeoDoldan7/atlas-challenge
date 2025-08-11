import React from 'react';
import type { HealthcareSubscription } from '../../types';
import { ActiveSubscriptionCard } from './ActiveSubscriptionCard';
import { DraftSubscriptionCard } from './DraftSubscriptionCard';
import { CancelledTerminatedSubscriptionCard } from './CancelledTerminatedSubscriptionCard';

interface SubscriptionStatusCardsProps {
  subscription: HealthcareSubscription;
}

export const SubscriptionStatusCards: React.FC<SubscriptionStatusCardsProps> = ({ subscription }) => {
  if (subscription.status === 'ACTIVE') {
    return <ActiveSubscriptionCard subscription={subscription} />;
  }

  if (subscription.status === 'DRAFT') {
    return <DraftSubscriptionCard subscription={subscription} />;
  }

  if (subscription.status === 'CANCELLED' || subscription.status === 'TERMINATED') {
    return <CancelledTerminatedSubscriptionCard subscription={subscription} />;
  }

  return null;
};