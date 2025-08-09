import { useQuery } from '@apollo/client';
import type { HealthcareSubscription, SubscriptionsResponse, ApiError } from '../types';
import { GET_SUBSCRIPTIONS_QUERY } from '../lib/queries';

interface UseSubscriptionsReturn {
  subscriptions: HealthcareSubscription[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<unknown>;
}

/**
 * Custom hook to fetch all healthcare subscriptions using Apollo Client
 */
export const useSubscriptions = (): UseSubscriptionsReturn => {
  const { data, loading, error, refetch } = useQuery<SubscriptionsResponse>(
    GET_SUBSCRIPTIONS_QUERY,
    {
      errorPolicy: 'all',
    }
  );

  const apiError: ApiError | null = error
    ? {
        message: error.message,
        graphQLErrors: error.graphQLErrors?.map(err => ({
          message: err.message,
          locations: err.locations,
          path: err.path,
          extensions: err.extensions,
        })),
      }
    : null;

  return {
    subscriptions: data?.getSubscriptions || [],
    loading,
    error: apiError,
    refetch,
  };
};