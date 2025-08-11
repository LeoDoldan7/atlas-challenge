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
      demographic {
        id
        firstName
        lastName
        governmentId
        birthDate
        createdAt
      }
      wallet {
        id
        employeeId
        balanceCents
        currencyCode
        createdAt
      }
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

export const GET_SUBSCRIPTIONS_QUERY = gql`
  query GetSubscriptions {
    getSubscriptions {
      id
      companyId
      employeeId
      planId
      type
      status
      startDate
      endDate
      billingAnchor
      lastPaymentAt
      createdAt
      employee {
        id
        email
        birthDate
        maritalStatus
        demographic {
          id
          firstName
          lastName
          governmentId
          birthDate
          createdAt
        }
      }
      plan {
        id
        name
      }
      items {
        id
        role
        demographicId
        createdAt
      }
      files {
        id
        healthcareSubscriptionId
        path
        originalName
        fileSizeBytes
        mimeType
        createdAt
      }
      steps {
        id
        healthcareSubscriptionId
        type
        status
        createdAt
        completedAt
      }
    }
  }
`;

export const GET_EMPLOYEE_SUBSCRIPTIONS_QUERY = gql`
  query GetEmployeeSubscriptions($employeeId: String!) {
    getSubscriptions(employeeId: $employeeId) {
      id
      companyId
      employeeId
      planId
      type
      status
      startDate
      endDate
      billingAnchor
      lastPaymentAt
      createdAt
      employee {
        id
        email
        birthDate
        maritalStatus
        demographic {
          id
          firstName
          lastName
          governmentId
          birthDate
          createdAt
        }
      }
      plan {
        id
        name
      }
      items {
        id
        role
        demographicId
        createdAt
      }
      files {
        id
        healthcareSubscriptionId
        path
        originalName
        fileSizeBytes
        mimeType
        createdAt
      }
      steps {
        id
        healthcareSubscriptionId
        type
        status
        createdAt
        completedAt
      }
    }
  }
`;

export const CREATE_SUBSCRIPTION_MUTATION = gql`
  mutation CreateSubscription($createSubscriptionInput: CreateSubscriptionInput!) {
    createSubscription(createSubscriptionInput: $createSubscriptionInput) {
      id
      companyId
      employeeId
      planId
      type
      status
      startDate
      endDate
      billingAnchor
      lastPaymentAt
      createdAt
      employee {
        id
        email
        birthDate
        maritalStatus
        demographic {
          id
          firstName
          lastName
          governmentId
          birthDate
          createdAt
        }
      }
      plan {
        id
        name
      }
      items {
        id
        role
        demographicId
        createdAt
      }
    }
  }
`;

export const UPLOAD_FAMILY_DEMOGRAPHICS_MUTATION = gql`
  mutation UploadFamilyDemographics($uploadFamilyDemographicsInput: UploadFamilyDemographicsInput!) {
    uploadFamilyDemographics(uploadFamilyDemographicsInput: $uploadFamilyDemographicsInput) {
      id
      companyId
      employeeId
      planId
      type
      status
      startDate
      endDate
      billingAnchor
      lastPaymentAt
      createdAt
      employee {
        id
        email
        birthDate
        maritalStatus
        demographic {
          id
          firstName
          lastName
          governmentId
          birthDate
          createdAt
        }
      }
      plan {
        id
        name
      }
      items {
        id
        role
        demographicId
        createdAt
      }
    }
  }
`;

export const UPLOAD_FILES_MUTATION = gql`
  mutation UploadFiles($uploadFilesInput: UploadFilesInput!) {
    uploadFiles(uploadFilesInput: $uploadFilesInput) {
      id
      companyId
      employeeId
      planId
      type
      status
      startDate
      endDate
      billingAnchor
      lastPaymentAt
      createdAt
      employee {
        id
        email
        birthDate
        maritalStatus
        demographic {
          id
          firstName
          lastName
          governmentId
          birthDate
          createdAt
        }
      }
      plan {
        id
        name
      }
      items {
        id
        role
        demographicId
        createdAt
      }
      files {
        id
        healthcareSubscriptionId
        path
        originalName
        fileSizeBytes
        mimeType
        createdAt
      }
    }
  }
`;

export const ACTIVATE_PLAN_MUTATION = gql`
  mutation ActivatePlan($activatePlanInput: ActivatePlanInput!) {
    activatePlan(activatePlanInput: $activatePlanInput) {
      id
      companyId
      employeeId
      planId
      type
      status
      startDate
      endDate
      billingAnchor
      lastPaymentAt
      createdAt
      employee {
        id
        email
        birthDate
        maritalStatus
        demographic {
          id
          firstName
          lastName
          governmentId
          birthDate
          createdAt
        }
      }
      plan {
        id
        name
      }
      items {
        id
        role
        demographicId
        createdAt
      }
      files {
        id
        healthcareSubscriptionId
        path
        originalName
        fileSizeBytes
        mimeType
        createdAt
      }
    }
  }
`;

export const GET_SUBSCRIPTION_STATUS_QUERY = gql`
  query GetSubscriptionStatus($subscriptionId: String!) {
    getSubscriptionStatus(subscriptionId: $subscriptionId) {
      id
      companyId
      employeeId
      planId
      type
      status
      startDate
      endDate
      billingAnchor
      lastPaymentAt
      createdAt
      employee {
        id
        email
        birthDate
        maritalStatus
        demographic {
          id
          firstName
          lastName
          governmentId
          birthDate
          createdAt
        }
      }
      plan {
        id
        name
      }
      items {
        id
        role
        demographicId
        createdAt
      }
      files {
        id
        healthcareSubscriptionId
        path
        originalName
        fileSizeBytes
        mimeType
        createdAt
      }
      steps {
        id
        healthcareSubscriptionId
        type
        status
        createdAt
        completedAt
      }
    }
  }
`;

export const PROCESS_COMPANY_PAYMENTS_MUTATION = gql`
  mutation ProcessCompanyPayments($processPaymentsInput: ProcessPaymentsInput!) {
    processCompanyPayments(processPaymentsInput: $processPaymentsInput) {
      overallSuccess
      totalAmountProcessed
      totalSuccessfulPayments
      totalFailedPayments
      totalPartialFailures
      employeeResults {
        employeeId
        success
        amountPaid
        subscriptionsPaid
        error
        partialSuccess
      }
    }
  }
`;

export const COMPANY_SPENDING_STATISTICS_QUERY = gql`
  query GetCompanySpendingStatistics($companyId: String!) {
    getCompanySpendingStatistics(companyId: $companyId) {
      companyId
      companyName
      totalMonthlyCostCents
      companyMonthlyCostCents
      employeeMonthlyCostCents
      employeeBreakdown {
        employeeId
        employeeName
        totalMonthlyCostCents
        companyMonthlyCostCents
        employeeMonthlyCostCents
      }
      planBreakdown {
        planId
        planName
        subscriptionCount
        totalMonthlyCostCents
        companyMonthlyCostCents
        employeeMonthlyCostCents
      }
    }
  }
`;