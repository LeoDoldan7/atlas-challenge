import { useQuery } from '@apollo/client';
import type { Employee, EmployeesByCompanyResponse, ApiError } from '../types';
import { EMPLOYEES_BY_COMPANY_QUERY } from '../lib/queries';

interface UseEmployeesReturn {
  employees: Employee[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<unknown>;
}

/**
 * Custom hook to fetch employees for a specific company using Apollo Client
 */
export const useEmployees = (companyId: string): UseEmployeesReturn => {
  const { data, loading, error, refetch } = useQuery<EmployeesByCompanyResponse>(
    EMPLOYEES_BY_COMPANY_QUERY,
    {
      variables: { companyId },
      skip: !companyId,
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
    employees: data?.employeesByCompany || [],
    loading,
    error: apiError,
    refetch,
  };
};