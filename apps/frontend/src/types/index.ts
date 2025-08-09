// GraphQL response wrapper type
export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
}

// String union types from GraphQL schema
export type MaritalStatus = 
  | 'DIVORCED'
  | 'MARRIED'
  | 'SEPARATED'
  | 'SINGLE'
  | 'WIDOWED';

export type ItemRole = 
  | 'CHILD'
  | 'EMPLOYEE'
  | 'SPOUSE';

export type SubscriptionStatus = 
  | 'ACTIVE'
  | 'CANCELED'
  | 'DEMOGRAPHIC_VERIFICATION_PENDING'
  | 'DOCUMENT_UPLOAD_PENDING'
  | 'PLAN_ACTIVATION_PENDING'
  | 'TERMINATED';

export type SubscriptionType = 
  | 'FAMILY'
  | 'INDIVIDUAL';

// Main entity types
export interface Employee {
  id: string;
  companyId: string;
  demographicsId: string;
  email: string;
  birthDate: string; // DateTime as ISO string
  maritalStatus: MaritalStatus;
  createdAt: string; // DateTime as ISO string
}

export interface HealthcarePlan {
  id: string;
  name: string;
  costEmployeeCents: string;
  pctEmployeePaidByCompany: string;
  costSpouseCents: string;
  pctSpousePaidByCompany: string;
  costChildCents: string;
  pctChildPaidByCompany: string;
}

export interface HealthcareSubscription {
  id: string;
  companyId: string;
  employeeId: string;
  planId: string;
  type: SubscriptionType;
  status: SubscriptionStatus;
  startDate: string; // DateTime as ISO string
  endDate?: string; // DateTime as ISO string
  billingAnchor: number;
  createdAt: string; // DateTime as ISO string
  employee?: Employee;
  plan?: HealthcarePlan;
}

// GraphQL query response types
export interface EmployeesByCompanyResponse {
  employeesByCompany: Employee[];
}

export interface HealthcarePlansResponse {
  healthcarePlans: HealthcarePlan[];
}

// API error type compatible with Apollo Client
export interface ApiError {
  message: string;
  graphQLErrors?: Array<{
    message: string;
    locations?: ReadonlyArray<{
      readonly line: number;
      readonly column: number;
    }>;
    readonly path?: ReadonlyArray<string | number>;
    readonly extensions?: Record<string, unknown>;
  }>;
}