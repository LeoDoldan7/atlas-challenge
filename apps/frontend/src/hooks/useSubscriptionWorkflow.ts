import { useMemo } from 'react';
import type { HealthcareSubscription, HealthcareSubscriptionItem } from '../types';

export const useSubscriptionWorkflow = (subscription: HealthcareSubscription | undefined) => {
  const getCurrentWorkflowStep = useMemo(() => {
    if (!subscription?.steps) return null;
    
    // If subscription is not PENDING, return the actual status
    if (subscription.status !== 'PENDING') {
      return subscription.status;
    }

    // Find the first incomplete step to determine what's needed next
    const demographicStep = subscription.steps.find(step => step.type === 'DEMOGRAPHIC_VERIFICATION');
    const documentStep = subscription.steps.find(step => step.type === 'DOCUMENT_UPLOAD');
    const activationStep = subscription.steps.find(step => step.type === 'PLAN_ACTIVATION');

    if (demographicStep?.status === 'PENDING') {
      return 'DEMOGRAPHIC_VERIFICATION_PENDING';
    } else if (documentStep?.status === 'PENDING') {
      return 'DOCUMENT_UPLOAD_PENDING';  
    } else if (activationStep?.status === 'PENDING') {
      return 'PLAN_ACTIVATION_PENDING';
    }

    return 'PENDING';
  }, [subscription]);

  const isStepCompleted = useMemo(() => (stepType: string) => {
    return subscription?.steps?.find(step => step.type === stepType)?.status === 'COMPLETED';
  }, [subscription]);

  const getSubscriptionItemCounts = useMemo(() => {
    if (!subscription?.items) return { spouseCount: 0, childrenCount: 0 };

    const spouseCount = subscription.items.filter((item: HealthcareSubscriptionItem) => item.role === 'SPOUSE').length;
    const childrenCount = subscription.items.filter((item: HealthcareSubscriptionItem) => item.role === 'CHILD').length;

    return { spouseCount, childrenCount };
  }, [subscription]);

  const getStepProgress = useMemo(() => {
    if (!subscription?.steps) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = subscription.steps.filter(step => step.status === 'COMPLETED').length;
    const total = subscription.steps.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { completed, total, percentage };
  }, [subscription]);

  return {
    currentStep: getCurrentWorkflowStep,
    isStepCompleted,
    subscriptionItemCounts: getSubscriptionItemCounts,
    stepProgress: getStepProgress,
  };
};