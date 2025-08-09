import { gql } from '@apollo/client';

// GraphQL queries using Apollo Client's gql tag
export const EMPLOYEES_BY_COMPANY_QUERY = gql`
  query EmployeesByCompany($companyId: String!) {
    employeesByCompany(companyId: $companyId) {
      id
      companyId
      demographicsId
      email
      birthDate
      maritalStatus
      createdAt
    }
  }
`;

export const HEALTHCARE_PLANS_QUERY = gql`
  query HealthcarePlans {
    healthcarePlans {
      id
      name
      costEmployeeCents
      pctEmployeePaidByCompany
      costSpouseCents
      pctSpousePaidByCompany
      costChildCents
      pctChildPaidByCompany
    }
  }
`;