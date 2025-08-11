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
  | 'CANCELLED'
  | 'DRAFT'
  | 'EXPIRED'
  | 'PENDING'
  | 'TERMINATED';

export type SubscriptionType = 
  | 'FAMILY'
  | 'INDIVIDUAL';

export type SubscriptionStepType = 
  | 'DEMOGRAPHIC_VERIFICATION'
  | 'DOCUMENT_UPLOAD'
  | 'PLAN_ACTIVATION';

export type StepStatus = 
  | 'PENDING'
  | 'COMPLETED';

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
  companyPct?: number; // Custom percentage company pays (0-100)
  employeePct?: number; // Custom percentage employee pays (0-100)
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

export interface SubscriptionStep {
  id: string;
  healthcareSubscriptionId: string;
  type: SubscriptionStepType;
  status: StepStatus;
  createdAt: string; // DateTime as ISO string
  completedAt?: string; // DateTime as ISO string
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
  steps?: SubscriptionStep[];
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
  success: boolean;
  amountPaid?: string;
  subscriptionsPaid?: number;
  error?: string;
  partialSuccess?: boolean;
}

export interface PaymentResult {
  overallSuccess: boolean;
  totalAmountProcessed: string;
  totalSuccessfulPayments: number;
  totalFailedPayments: number;
  totalPartialFailures: number;
  employeeResults: EmployeePaymentResult[];
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