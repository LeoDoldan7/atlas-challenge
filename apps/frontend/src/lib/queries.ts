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