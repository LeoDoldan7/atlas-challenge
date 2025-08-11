import { useMutation } from '@apollo/client';
import type { HealthcareSubscription, ApiError } from '../types';
import { CREATE_SUBSCRIPTION_MUTATION, GET_SUBSCRIPTIONS_QUERY } from '../lib/queries';

interface MemberTypePercentages {
  companyPercent: number;
  employeePercent: number;
}

interface CreateSubscriptionInput {
  employeeId: number;
  includeSpouse: boolean;
  numOfChildren: number;
  planId: number;
  employeePercentages?: MemberTypePercentages;
  spousePercentages?: MemberTypePercentages;
  childPercentages?: MemberTypePercentages;
}

interface CreateSubscriptionResponse {
  createSubscription: HealthcareSubscription;
}

interface UseCreateSubscriptionReturn {
  createSubscription: (input: CreateSubscriptionInput) => Promise<HealthcareSubscription>;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Custom hook to create a healthcare subscription using Apollo Client
 */
export const useCreateSubscription = (): UseCreateSubscriptionReturn => {
  const [createSubscriptionMutation, { loading, error }] = useMutation<
    CreateSubscriptionResponse,
    { createSubscriptionInput: CreateSubscriptionInput }
  >(CREATE_SUBSCRIPTION_MUTATION, {
    refetchQueries: [{ query: GET_SUBSCRIPTIONS_QUERY }],
  });

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

  const createSubscription = async (input: CreateSubscriptionInput): Promise<HealthcareSubscription> => {
    try {
      const result = await createSubscriptionMutation({
        variables: {
          createSubscriptionInput: input,
        },
      });

      if (!result.data) {
        throw new Error('No data returned from createSubscription mutation');
      }

      return result.data.createSubscription;
    } catch (err) {
      console.error('Error creating subscription:', err);
      throw err;
    }
  };

  return {
    createSubscription,
    loading,
    error: apiError,
  };
};