import { useQuery } from '@apollo/client';
import type { HealthcarePlan, HealthcarePlansResponse, ApiError } from '../types';
import { HEALTHCARE_PLANS_QUERY } from '../lib/queries';

interface UseHealthcarePlansReturn {
  plans: HealthcarePlan[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<any>;
}

/**
 * Custom hook to fetch all healthcare plans using Apollo Client
 */
export const useHealthcarePlans = (): UseHealthcarePlansReturn => {
  const { data, loading, error, refetch } = useQuery<HealthcarePlansResponse>(
    HEALTHCARE_PLANS_QUERY,
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
    plans: data?.healthcarePlans || [],
    loading,
    error: apiError,
    refetch,
  };
};