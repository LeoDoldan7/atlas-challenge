# Atlas Healthcare Subscription System

A full-stack healthcare subscription management system built with NestJS, GraphQL, Prisma, React, and TypeScript.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Business Logic](#business-logic)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Development Guidelines](#development-guidelines)

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm
- Docker and Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd atlas-challenge
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files from examples
   cp apps/backend/.env.example apps/backend/.env
   ```

4. **Start Database and MinIO**
   ```bash
   # Start PostgreSQL and MinIO using Docker Compose
   docker-compose up -d
   ```

5. **Database Setup**
   ```bash
   # Generate Prisma client, run migrations, and seed
   cd apps/backend
   pnpm prisma generate
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```

### Running the Application

```bash
# Start both backend and frontend (from root directory)
npm run dev

# Backend runs on port 3000
# Frontend runs on port 3001
```

### Testing

```bash
# Run all tests (from root directory)
npm run test
```

## Project Structure

```
atlas-challenge/
├── apps/
│   ├── backend/          # NestJS GraphQL API
│   │   ├── src/
│   │   │   ├── domain/           # Domain layer (aggregates, services, value objects)
│   │   │   ├── modules/          # Feature modules
│   │   │   └── graphql/          # GraphQL resolvers & types
│   │   ├── prisma/              # Database schema & migrations
│   │   └── test/                # E2E tests
│   └── frontend/         # React TypeScript SPA
│       ├── src/
│       │   ├── components/      # Reusable UI components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── pages/          # Page components
│       │   ├── lib/            # GraphQL queries & utilities
│       │   ├── types/          # TypeScript type definitions
│       │   └── utils/          # Helper functions
│       └── public/             # Static assets
├── package.json          # Root package.json
└── README.md
```

## Architecture Overview

### Overall Architecture

The system follows **Clean Architecture** principles with clear separation between:

1. **Domain Layer** - Core business logic, entities, and rules
2. **Application Layer** - Use cases and orchestration  
3. **Presentation Layer** - GraphQL API and React frontend

### Key Architectural Decisions

#### 1. **Monorepo Structure**
- **Decision**: Use a monorepo with separate backend/frontend apps
- **Rationale**: Shared types, unified dependency management, easier development
- **Implementation**: Apps organized under `/apps` directory

#### 2. **Domain-Driven Design (DDD)**
- **Decision**: Implement DDD patterns in the backend
- **Rationale**: Complex healthcare business logic requires clear domain modeling
- **Implementation**: 
  - Aggregates for consistency boundaries
  - Domain services for business logic
  - Value objects for typed data
  - Repository pattern for data access

#### 3. **Event-Driven State Management**
- **Decision**: Use state machines for subscription workflow
- **Rationale**: Healthcare subscriptions have complex state transitions
- **Implementation**: State machine pattern with explicit transitions

#### 4. **GraphQL API Design**
- **Decision**: Use GraphQL instead of REST
- **Rationale**: Type-safe API, efficient data fetching, real-time subscriptions
- **Implementation**: Code-first approach with NestJS GraphQL

#### 5. **Component-Based Frontend**
- **Decision**: Highly modular React components
- **Rationale**: Reusability, testability, maintainability
- **Implementation**: Atomic design principles with custom hooks

## Business Logic

### Core Domain Concepts

#### 1. **Healthcare Subscriptions**

A subscription represents an employee's enrollment in a healthcare plan.

**Subscription Types:**
- `INDIVIDUAL` - Coverage for employee only
- `FAMILY` - Coverage for employee + family members

**Subscription Statuses:**
- `DRAFT` - Initial state, not yet activated
- `PENDING` - Active enrollment process in progress
- `ACTIVE` - Fully enrolled and providing coverage
- `CANCELLED` - Cancelled by employee
- `TERMINATED` - Terminated by system/admin
- `EXPIRED` - Expired due to time limits

#### 2. **Enrollment Workflow**

The enrollment process follows a step-based workflow:

```
DRAFT → Activate → PENDING → Complete Steps → ACTIVE
                     ↓
                 Step-based Process:
                 1. Demographic Verification
                 2. Document Upload  
                 3. Plan Activation
```

**Enrollment Steps:**
1. **Demographic Verification** - Collect family member information
2. **Document Upload** - Upload required documents (ID, employment proof, etc.)
3. **Plan Activation** - Final activation after review

#### 3. **Payment Processing**

Healthcare subscriptions involve complex payment allocation:

**Payment Components:**
- **Employee Contribution** - Deducted from employee wallet
- **Company Contribution** - Paid by employer
- **Payment Allocation** - Distribution between employee/company

**Payment States:**
- `PENDING` - Payment initiated but not processed
- `COMPLETED` - Successfully processed
- `FAILED` - Payment failed
- `PARTIAL` - Partially processed (complex scenarios)

### Business Rules

#### Subscription Management Rules

1. **Item Modification Rules**
   - Items can only be modified in `DRAFT` status
   - Once enrollment starts, family composition is locked

2. **State Transition Rules**
   - `DRAFT → PENDING` requires activation
   - `PENDING → ACTIVE` requires all steps completed
   - `ACTIVE` subscriptions cannot be modified, only cancelled

3. **Family Member Rules**
   - Each subscription item represents one covered person
   - Roles: `EMPLOYEE`, `SPOUSE`, `CHILD`
   - Demographics required for all family members

#### Payment Rules

1. **Payment Allocation Rules**
   - Employee wallet must have sufficient balance for employee portion
   - Company contribution processed separately
   - Partial payments handled gracefully

2. **Payment Retry Logic**
   - Failed payments trigger retry mechanisms
   - State machine handles payment transitions
   - Partial payment scenarios preserved

#### Document Management Rules

1. **File Upload Rules**
   - Maximum file size: 5MB
   - Allowed formats: PDF, JPG, PNG, GIF, Word documents
   - Files stored in MinIO with metadata in database

2. **Document Requirements**
   - Government-issued ID for all family members
   - Proof of employment for employee
   - Previous insurance documentation (if applicable)

## Backend Architecture

### Domain Layer

#### Aggregates

**Subscription Aggregate** (`src/domain/aggregates/subscription.aggregate.ts`)
- Central entity managing subscription lifecycle
- Enforces business rules and invariants
- Uses dependency injection for validation and payment services

**Key Methods:**
- `activate()` - Transitions from DRAFT to PENDING
- `addItem()` - Adds family member (only in DRAFT)
- `completeStep()` - Progresses through enrollment steps
- `processPayment()` - Handles payment allocation

#### Domain Services

**SubscriptionValidationService** (`src/domain/services/subscription-validation.service.ts`)
- Validates business rules for subscriptions
- Ensures state transitions are valid
- Validates family member modifications

**EnrollmentStepManager** (`src/domain/services/enrollment-step-manager.service.ts`)
- Manages enrollment step lifecycle
- Initializes standard workflow steps
- Handles step completion logic

**SubscriptionPaymentCoordinator** (`src/domain/services/subscription-payment-coordinator.service.ts`)
- Coordinates payment processing with state machine
- Handles complex payment scenarios
- Manages employee wallet interactions

#### Value Objects

**Money** (`src/domain/value-objects/money.ts`)
- Immutable monetary value representation
- Currency-aware calculations
- Prevents precision errors

**SubscriptionPeriod** (`src/domain/value-objects/subscription-period.ts`)
- Represents subscription time periods
- Handles date calculations and validations

### Application Layer

#### GraphQL Modules

**HealthcareSubscriptionModule** (`src/modules/healthcare-subscription/`)
- Main subscription management
- CRUD operations and state transitions
- Integration with payment processing

**FileUploadModule** (`src/modules/file-upload/`)
- Document upload functionality
- MinIO integration for file storage
- File metadata management

**PaymentModule** (`src/modules/payment/`)
- Payment processing logic
- Employee wallet management
- Company spending calculations

#### Resolvers

GraphQL resolvers follow a consistent pattern:
1. **Input Validation** - Validate GraphQL input types
2. **Domain Logic** - Delegate to domain services/aggregates
3. **Data Transformation** - Convert domain objects to GraphQL types
4. **Error Handling** - Convert domain errors to GraphQL errors

### Data Layer

#### Database Integration

**Prisma ORM** - Type-safe database access
- Schema-first database design
- Automated migrations
- Type generation for TypeScript

**Repository Pattern** - Abstract data access
- Clean separation from domain logic
- Testable data access layer
- Consistent CRUD operations

#### External Services

**MinIO Integration** - File storage service
- S3-compatible object storage
- File upload/download management
- Metadata tracking in database

## Frontend Architecture

### Component Architecture

The frontend follows **Atomic Design** principles with highly modular components:

#### Page Components
- `SubscriptionDetails.tsx` - Main subscription management page
- `EmployeeDetails.tsx` - Employee information and subscription history
- Container components that orchestrate business logic

#### Feature Components

**Subscription Components** (`src/components/subscription/`)
- `SubscriptionOverviewCard` - Basic subscription information
- `DemographicVerificationCard` - Family demographics collection
- `DocumentUploadCard` - File upload interface
- `PlanActivationCard` - Final activation step
- Status-specific components for different subscription states

**Employee Components** (`src/components/employee/`)
- `EmployeeInformationCard` - Employee personal details
- `EmployeeSubscriptionsList` - Subscription history display

#### Atomic Components

**Form Components:**
- `SpouseInformationSection` - Spouse demographic form
- `ChildrenInformationSection` - Children demographic forms
- `FileUploadArea` - File upload interface
- `SelectedFileDisplay` - Selected file management

**Display Components:**
- `SubmittedDocumentsList` - Document list display
- `PlanActivationAlert` - Activation status alert
- `ActiveSubscriptionCard` - Active subscription details

### State Management

#### Custom Hooks Pattern

**Business Logic Hooks:**
- `useSubscriptionWorkflow` - Manages subscription state and step logic
- `useDemographicForm` - Handles demographic form validation and submission
- `useFileUpload` - Manages file upload state and validation
- `usePlanActivation` - Handles plan activation process

**Benefits:**
- Separation of business logic from UI components
- Reusable across different components
- Easier testing of business logic
- Clean component interfaces

#### Form Management

**React Hook Form + Zod**
- Type-safe form validation
- Schema-based validation rules
- Optimized re-rendering
- Integration with GraphQL mutations

### Data Layer

#### GraphQL Integration

**Apollo Client** - GraphQL client with caching
- Automatic query caching
- Optimistic updates
- Real-time subscriptions support
- Type-safe query generation

**Query Organization:**
- Centralized queries in `src/lib/queries.ts`
- Fragment-based query composition
- Consistent error handling patterns

## API Documentation

### GraphQL Schema

#### Core Types

```graphql
type HealthcareSubscription {
  id: ID!
  status: SubscriptionStatus!
  type: SubscriptionType!
  startDate: DateTime!
  endDate: DateTime
  billingAnchor: Int!
  items: [HealthcareSubscriptionItem!]!
  steps: [EnrollmentStep!]!
  files: [HealthcareSubscriptionFile!]!
  plan: HealthcarePlan
}

enum SubscriptionStatus {
  DRAFT
  PENDING
  ACTIVE
  CANCELLED
  TERMINATED
  EXPIRED
}

enum SubscriptionType {
  INDIVIDUAL
  FAMILY
}
```

#### Key Mutations

```graphql
# Activate subscription (DRAFT → PENDING)
activateSubscription(input: ActivateSubscriptionInput!): HealthcareSubscription!

# Upload family demographics
uploadFamilyDemographics(input: FamilyDemographicsInput!): HealthcareSubscription!

# Upload documents
uploadFiles(input: UploadFilesInput!): HealthcareSubscription!

# Activate plan (final step)
activatePlan(input: ActivatePlanInput!): HealthcareSubscription!
```

#### Key Queries

```graphql
# Get subscription with current status
getSubscriptionStatus(subscriptionId: ID!): HealthcareSubscription!

# Get employee subscriptions
getSubscriptions(employeeId: ID!): [HealthcareSubscription!]!

# Get company employees
employeesByCompany(companyId: ID!): [Employee!]!
```

## Database Schema

### Core Tables

#### Subscriptions
```sql
CREATE TABLE "Subscription" (
  id VARCHAR PRIMARY KEY,
  companyId VARCHAR NOT NULL,
  employeeId VARCHAR NOT NULL,
  planId VARCHAR NOT NULL,
  status "SubscriptionStatus" NOT NULL DEFAULT 'DRAFT',
  type "SubscriptionType" NOT NULL,
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP,
  billingAnchor INTEGER NOT NULL
);
```

#### Subscription Items (Family Members)
```sql
CREATE TABLE "SubscriptionItem" (
  id VARCHAR PRIMARY KEY,
  subscriptionId VARCHAR NOT NULL,
  role "SubscriptionItemRole" NOT NULL,
  demographicId VARCHAR,
  FOREIGN KEY (subscriptionId) REFERENCES "Subscription"(id)
);
```

#### Enrollment Steps
```sql
CREATE TABLE "EnrollmentStep" (
  id VARCHAR PRIMARY KEY,
  subscriptionId VARCHAR NOT NULL,
  type "SubscriptionStepType" NOT NULL,
  status "StepStatus" NOT NULL DEFAULT 'PENDING',
  createdAt TIMESTAMP NOT NULL DEFAULT now(),
  completedAt TIMESTAMP,
  FOREIGN KEY (subscriptionId) REFERENCES "Subscription"(id)
);
```

### Key Relationships

- **Subscription** → **SubscriptionItem** (1:N) - Family members
- **Subscription** → **EnrollmentStep** (1:N) - Workflow steps  
- **Subscription** → **SubscriptionFile** (1:N) - Uploaded documents
- **Employee** → **Subscription** (1:N) - Employee subscriptions
- **Company** → **Employee** (1:N) - Company employees

## Development Guidelines

### Code Standards

#### Backend Standards
- **Domain-Driven Design** - Clear domain boundaries and ubiquitous language
- **SOLID Principles** - Single responsibility, dependency injection
- **Clean Architecture** - Layered architecture with dependency inversion
- **Type Safety** - Comprehensive TypeScript usage

#### Frontend Standards
- **Component Composition** - Atomic design with reusable components
- **Custom Hooks** - Business logic separation from UI components
- **Type Safety** - Generated GraphQL types, strict TypeScript
- **Consistent Patterns** - Standardized component and hook patterns

### Testing Strategy

#### Backend Testing
- **Unit Tests** - Domain logic, services, and utilities
- **Integration Tests** - Database operations and external services
- **E2E Tests** - Complete user workflows via GraphQL API

#### Frontend Testing
- **Component Tests** - React Testing Library for component behavior
- **Hook Tests** - Custom hook logic testing
- **Integration Tests** - Complete user workflows

### Performance Considerations

#### Backend Optimization
- **Database Indexing** - Optimized queries for subscription lookups
- **GraphQL DataLoader** - N+1 query prevention
- **Caching Strategy** - Redis for frequently accessed data

#### Frontend Optimization
- **Component Memoization** - React.memo for expensive components
- **Query Optimization** - GraphQL fragment usage and caching
- **Code Splitting** - Lazy loading for route-based splitting

### Security Considerations

#### Data Protection
- **Input Validation** - Comprehensive input sanitization
- **File Upload Security** - File type and size restrictions
- **Database Security** - Parameterized queries, proper indexing

#### Authentication & Authorization
- **Role-Based Access** - Employee/admin role separation
- **Data Isolation** - Company-scoped data access
- **Audit Logging** - Comprehensive action logging

### Scalability Considerations

#### Database Scalability

**Read Scaling:**
- **Read Replicas** - Distribute read queries across multiple database replicas
- **Connection Pooling** - Prisma connection pooling to manage database connections efficiently
- **Query Optimization** - Indexed queries for subscription lookups by employee, company, and status
- **Materialized Views** - Pre-computed aggregations for reporting and analytics

**Write Scaling:**
- **Database Sharding** - Partition data by company ID for horizontal scaling
- **Write Optimization** - Batch operations for bulk enrollment processing
- **Queue Processing** - Async processing for non-critical operations (notifications, analytics)

**Recommended Database Architecture for Scale:**
```
┌─────────────────┐    ┌─────────────────┐
│   Read Replica  │    │   Read Replica  │
│   (Company A-M) │    │   (Company N-Z) │
└─────────────────┘    └─────────────────┘
        │                       │
        └───────┬───────────────┘
                │
┌─────────────────────────────────────────┐
│            Primary Database              │
│        (All Companies - Write)          │
└─────────────────────────────────────────┘
```

#### Application Scaling

**Horizontal Scaling:**
- **Stateless Services** - NestJS application designed for horizontal scaling
- **Load Balancing** - Multiple application instances behind load balancer
- **Container Orchestration** - Kubernetes deployment with auto-scaling
- **Microservices Evolution** - Modular architecture ready for service extraction

**Caching Strategy:**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │    │    CDN      │    │   Redis     │
│   Cache     │    │   Cache     │    │   Cache     │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ GraphQL     │    │ Static      │    │ Session     │
│ Query Cache │    │ Assets      │    │ Data        │
│ (Apollo)    │    │ (Images)    │    │ (User Data) │
└─────────────┘    └─────────────┘    └─────────────┘
```

**Performance Optimizations:**
- **GraphQL DataLoader** - Batch and cache database queries within single request
- **Response Caching** - Cache frequently accessed subscription data
- **Pagination** - Cursor-based pagination for large result sets
- **Field-Level Caching** - Cache computed fields (enrollment progress, payment status)

#### File Storage Scaling

**MinIO Cluster Setup:**
```
┌─────────────────┐    ┌─────────────────┐
│   MinIO Node 1  │    │   MinIO Node 2  │
│   (Documents)   │    │   (Documents)   │
└─────────────────┘    └─────────────────┘
        │                       │
        └───────┬───────────────┘
                │
┌─────────────────────────────────────────┐
│          Load Balancer                  │
│      (Distributed File Access)         │
└─────────────────────────────────────────┘
```

**File Storage Optimizations:**
- **CDN Integration** - CloudFront or similar for global file distribution
- **Multi-Region Replication** - Replicate critical documents across regions
- **Compression** - Automatic file compression for storage optimization
- **Lifecycle Policies** - Archive old documents to cheaper storage tiers

#### Frontend Scaling

**Performance Optimizations:**
- **Code Splitting** - Route-based and component-based lazy loading
- **Bundle Optimization** - Tree shaking and module federation
- **Image Optimization** - WebP format with fallbacks, lazy loading
- **Service Workers** - Cache API responses and static assets

**CDN Strategy:**
```
┌─────────────────┐
│   Global CDN    │
├─────────────────┤
│ • React Bundle  │
│ • CSS Assets    │
│ • Images        │
│ • Static Files  │
└─────────────────┘
        │
┌─────────────────┐
│   Edge Cache    │
├─────────────────┤
│ • GraphQL       │
│ • API Responses │
│ • User Sessions │
└─────────────────┘
```

#### Cost Optimization at Scale

**Resource Optimization:**
- **Auto-Scaling Groups** - Scale application instances based on demand
- **Spot Instances** - Use spot instances for batch processing workloads
- **Reserved Capacity** - Reserve database and compute capacity for predictable workloads
- **Storage Lifecycle Management** - Automatic transitions to cheaper storage classes

**Operational Efficiency:**
- **Infrastructure as Code** - Terraform/CloudFormation for reproducible deployments
- **Automated Deployments** - CI/CD pipelines with automated testing and deployment
- **Resource Monitoring** - Identify and eliminate unused or underutilized resources

## Development Guidelines

### Code Standards

#### Backend Standards
- **Domain-Driven Design** - Clear domain boundaries and ubiquitous language
- **SOLID Principles** - Single responsibility, dependency injection
- **Clean Architecture** - Layered architecture with dependency inversion
- **Type Safety** - Comprehensive TypeScript usage

#### Frontend Standards
- **Component Composition** - Atomic design with reusable components
- **Custom Hooks** - Business logic separation from UI components
- **Type Safety** - Generated GraphQL types, strict TypeScript
- **Consistent Patterns** - Standardized component and hook patterns

### Testing Strategy

#### Backend Testing
- **Unit Tests** - Domain logic, services, and utilities
- **Integration Tests** - Database operations and external services
- **E2E Tests** - Complete user workflows via GraphQL API

#### Frontend Testing
- **Component Tests** - React Testing Library for component behavior
- **Hook Tests** - Custom hook logic testing
- **Integration Tests** - Complete user workflows

### Performance Considerations

#### Backend Optimization
- **Database Indexing** - Optimized queries for subscription lookups
- **GraphQL DataLoader** - N+1 query prevention
- **Caching Strategy** - Redis for frequently accessed data

#### Frontend Optimization
- **Component Memoization** - React.memo for expensive components
- **Query Optimization** - GraphQL fragment usage and caching
- **Code Splitting** - Lazy loading for route-based splitting

### Security Considerations

#### Data Protection
- **Input Validation** - Comprehensive input sanitization
- **File Upload Security** - File type and size restrictions
- **Database Security** - Parameterized queries, proper indexing

#### Authentication & Authorization
- **Role-Based Access** - Employee/admin role separation
- **Data Isolation** - Company-scoped data access
- **Audit Logging** - Comprehensive action logging