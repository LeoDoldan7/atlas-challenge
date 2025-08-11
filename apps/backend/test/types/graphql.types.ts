// GraphQL response types for e2e tests
// These match the GraphQL schema definitions

/** Base GraphQL error structure */
export interface GraphQLError {
  readonly message: string;
  readonly locations?: ReadonlyArray<{
    readonly line: number;
    readonly column: number;
  }>;
  readonly path?: ReadonlyArray<string | number>;
  readonly extensions?: Record<string, unknown>;
}

/** Base GraphQL response structure with improved typing */
export interface GraphQLResponse<T = unknown> {
  readonly status: number;
  readonly body: {
    readonly data?: T;
    readonly errors?: ReadonlyArray<GraphQLError>;
  };
}

// Input types for mutations
export interface CreateSubscriptionInput {
  readonly employeeId: number;
  readonly planId: number;
  readonly includeSpouse: boolean;
  readonly numOfChildren: number;
}

export interface UploadFilesInput {
  readonly subscriptionId: string;
  readonly files: ReadonlyArray<{
    readonly filename: string;
    readonly mimetype: string;
    readonly data: string;
  }>;
}

export interface UploadFamilyDemographicsInput {
  readonly subscriptionId: string;
  readonly familyMembers: ReadonlyArray<{
    readonly role: ItemRole;
    readonly demographic: {
      readonly firstName: string;
      readonly lastName: string;
      readonly governmentId: string;
      readonly birthDate: string;
    };
  }>;
}

export interface ActivatePlanInput {
  readonly subscriptionId: string;
}

export interface ProcessPaymentsInput {
  readonly companyId: string;
}

// Enum types
export type ItemRole = 'EMPLOYEE' | 'SPOUSE' | 'CHILD';
export type MaritalStatus =
  | 'SINGLE'
  | 'MARRIED'
  | 'DIVORCED'
  | 'WIDOWED'
  | 'SEPARATED';
export type SubscriptionStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'ACTIVE'
  | 'CANCELLED'
  | 'EXPIRED';
export type SubscriptionType = 'INDIVIDUAL' | 'FAMILY';

export interface HealthcarePlan {
  readonly id: string;
  readonly name: string;
  readonly costEmployeeCents: string;
  readonly costSpouseCents: string;
  readonly costChildCents: string;
  readonly pctEmployeePaidByCompany: string;
  readonly pctSpousePaidByCompany: string;
  readonly pctChildPaidByCompany: string;
  readonly subscriptions?: ReadonlyArray<HealthcareSubscription>;
}

export interface Demographic {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly governmentId: string;
  readonly birthDate: string;
  readonly createdAt: string;
  readonly subItems?: ReadonlyArray<HealthcareSubscriptionItem>;
}

export interface Wallet {
  readonly id: string;
  readonly balanceCents: string;
  readonly currencyCode: string;
  readonly employeeId: string;
  readonly createdAt: string;
  readonly employee?: Employee;
}

export interface Employee {
  readonly id: string;
  readonly email: string;
  readonly birthDate: string;
  readonly maritalStatus: MaritalStatus;
  readonly companyId: string;
  readonly demographicsId: string;
  readonly createdAt: string;
  readonly demographic: Demographic;
  readonly wallet?: Wallet;
}

export interface Company {
  readonly id: string;
  readonly name: string;
  readonly countryIsoCode: string;
  readonly createdAt: string;
  readonly employees?: ReadonlyArray<Employee>;
  readonly subscriptions?: ReadonlyArray<HealthcareSubscription>;
}

export interface HealthcareSubscriptionFile {
  readonly id: string;
  readonly originalName: string;
  readonly path: string;
  readonly mimeType: string;
  readonly fileSizeBytes: number;
  readonly healthcareSubscriptionId: string;
  readonly createdAt: string;
  readonly subscription?: HealthcareSubscription;
}

export interface HealthcareSubscriptionItem {
  readonly id: string;
  readonly role: ItemRole;
  readonly demographicId?: string;
  readonly healthcareSubscriptionId: string;
  readonly createdAt: string;
  readonly demographic?: Demographic;
  readonly subscription?: HealthcareSubscription;
}

export interface HealthcareSubscription {
  readonly id: string;
  readonly employeeId: string;
  readonly companyId: string;
  readonly planId: string;
  readonly status: SubscriptionStatus;
  readonly type: SubscriptionType;
  readonly billingAnchor: number;
  readonly startDate: string;
  readonly endDate?: string;
  readonly lastPaymentAt?: string;
  readonly createdAt: string;
  readonly employee?: Employee;
  readonly company?: Company;
  readonly plan?: HealthcarePlan;
  readonly items?: ReadonlyArray<HealthcareSubscriptionItem>;
  readonly files?: ReadonlyArray<HealthcareSubscriptionFile>;
}

export interface CompanySpendingStatistics {
  readonly companyId: string;
  readonly companyName: string;
  readonly totalMonthlyCostCents: number;
  readonly companyMonthlyCostCents: number;
  readonly employeeMonthlyCostCents: number;
  readonly employeeBreakdown: ReadonlyArray<EmployeeSpendingStatistics>;
  readonly planBreakdown: ReadonlyArray<PlanSpendingStatistics>;
}

export interface EmployeeSpendingStatistics {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly totalMonthlyCostCents: number;
  readonly companyMonthlyCostCents: number;
  readonly employeeMonthlyCostCents: number;
}

export interface PlanSpendingStatistics {
  readonly planId: string;
  readonly planName: string;
  readonly subscriptionCount: number;
  readonly totalMonthlyCostCents: number;
  readonly companyMonthlyCostCents: number;
  readonly employeeMonthlyCostCents: number;
}

export interface EmployeePaymentResult {
  readonly employeeId: string;
  readonly amountPaid: string;
  readonly subscriptionsPaid: number;
}

export interface PaymentResult {
  readonly success: boolean;
  readonly totalAmountProcessed: string;
  readonly employeePayments: ReadonlyArray<EmployeePaymentResult>;
}

// Specific query response types for better type safety
export interface HealthcarePlansQueryResponse {
  readonly healthcarePlans: ReadonlyArray<HealthcarePlan>;
}

export interface EmployeesByCompanyQueryResponse {
  readonly employeesByCompany: ReadonlyArray<Employee>;
}

export interface SubscriptionsQueryResponse {
  readonly getSubscriptions: ReadonlyArray<HealthcareSubscription>;
}

export interface SubscriptionStatusQueryResponse {
  readonly getSubscriptionStatus: HealthcareSubscription;
}

export interface CompanySpendingQueryResponse {
  readonly getCompanySpendingStatistics: CompanySpendingStatistics;
}

export interface CreateSubscriptionMutationResponse {
  readonly createSubscription: HealthcareSubscription;
}

export interface UploadFilesMutationResponse {
  readonly uploadFiles: HealthcareSubscription;
}

export interface UploadFamilyDemographicsMutationResponse {
  readonly uploadFamilyDemographics: HealthcareSubscription;
}

export interface ActivatePlanMutationResponse {
  readonly activatePlan: HealthcareSubscription;
}

export interface ProcessPaymentsMutationResponse {
  readonly processCompanyPayments: PaymentResult;
}
