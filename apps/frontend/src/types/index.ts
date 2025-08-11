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
export interface Demographic {
  id: string;
  firstName: string;
  lastName: string;
  governmentId: string;
  birthDate: string; // DateTime as ISO string
  createdAt: string; // DateTime as ISO string
}

export interface Wallet {
  id: string;
  employeeId: string;
  balanceCents: string;
  currencyCode: string;
  createdAt: string; // DateTime as ISO string
}

export interface Employee {
  id: string;
  companyId: string;
  demographicsId: string;
  email: string;
  birthDate: string; // DateTime as ISO string
  maritalStatus: MaritalStatus;
  createdAt: string; // DateTime as ISO string
  demographic: Demographic;
  wallet?: Wallet;
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

export interface HealthcareSubscriptionItem {
  id: string;
  role: ItemRole;
  demographicId: string;
  createdAt: string; // DateTime as ISO string
}

export interface HealthcareSubscriptionFile {
  id: string;
  healthcareSubscriptionId: string;
  path: string;
  originalName: string;
  fileSizeBytes: number;
  mimeType: string;
  createdAt: string; // DateTime as ISO string
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
  lastPaymentAt?: string; // DateTime as ISO string
  createdAt: string; // DateTime as ISO string
  employee?: Employee;
  plan?: HealthcarePlan;
  items?: HealthcareSubscriptionItem[];
  files?: HealthcareSubscriptionFile[];
}

// GraphQL query response types
export interface EmployeesByCompanyResponse {
  employeesByCompany: Employee[];
}

export interface HealthcarePlansResponse {
  healthcarePlans: HealthcarePlan[];
}

export interface SubscriptionsResponse {
  getSubscriptions: HealthcareSubscription[];
}

export interface EmployeePaymentResult {
  employeeId: string;
  amountPaid: string;
  subscriptionsPaid: number;
}

export interface PaymentResult {
  success: boolean;
  totalAmountProcessed: string;
  employeePayments: EmployeePaymentResult[];
}

export interface ProcessPaymentsResponse {
  processCompanyPayments: PaymentResult;
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