# ADR 001: Individual Endpoints for Enrollment Steps

## Context
The original API specification proposed a single generic endpoint:
```
updateEnrollmentStep(subscriptionId, stepType, data): Progress enrollment
```

This endpoint would handle all enrollment step updates with a generic `data` parameter that would vary based on the `stepType`.

## Decision
I decided to create individual endpoints for each enrollment step type instead of using the single generic endpoint approach.

## Reasoning

### 1. Type Safety and Validation
- Each step has specific data requirements and validation rules
- Individual endpoints allow for precise TypeScript interfaces and schema validation

### 2. API Clarity and Documentation
- Each endpoint has a clear, single responsibility
- API documentation becomes more specific and actionable
- Developers can understand exactly what data is required for each step
- Reduces ambiguity about expected request/response formats

### 3. Error Handling and Debugging
- Step-specific error messages and validation feedback
- Easier to identify which step is failing in logs and monitoring
- More targeted error handling for different step types
- Clearer debugging experience for both developers and users

### 4. Evolution and Maintenance
- Individual endpoints can evolve independently
- Adding new steps doesn't affect existing step logic
- Better separation of concerns in the codebase

### 5. Performance and Optimization
- Each endpoint can have step-specific optimizations
- Reduces payload size by only including relevant data
- Enables step-specific caching strategies if needed
- Better monitoring and analytics per step type

## Implementation
Instead of a single generic GraphQL mutation:
```graphql
mutation UpdateEnrollmentStep($subscriptionId: ID!, $stepType: String!, $data: JSON!) {
  updateEnrollmentStep(subscriptionId: $subscriptionId, stepType: $stepType, data: $data) {
    # generic response
  }
}
```

We implement specific mutations for each enrollment step:
```graphql
mutation CreateSubscription($createSubscriptionInput: CreateSubscriptionInput!) {
  createSubscription(createSubscriptionInput: $createSubscriptionInput) {
    id
    enrollmentStatus
    # ... other fields
  }
}

mutation UploadFamilyDemographics($uploadFamilyDemographicsInput: UploadFamilyDemographicsInput!) {
  uploadFamilyDemographics(uploadFamilyDemographicsInput: $uploadFamilyDemographicsInput) {
    id
    enrollmentStatus
    familyMembers
    # ... other fields
  }
}

mutation UploadFiles($uploadFilesInput: UploadFilesInput!) {
  uploadFiles(uploadFilesInput: $uploadFilesInput) {
    id
    enrollmentStatus
    documents
    # ... other fields
  }
}

mutation ActivatePlan($activatePlanInput: ActivatePlanInput!) {
  activatePlan(activatePlanInput: $activatePlanInput) {
    id
    enrollmentStatus
    activationDate
    # ... other fields
  }
}
```

## Consequences

### Positive
- Clearer API contracts and documentation

### Negative
- More mutation definitions to maintain
- Slightly larger API surface area
- Requires more initial setup for new step types

## Notes
This decision aligns with GraphQL best practices of having specific, strongly-typed mutations. The trade-off of additional mutations for better type safety, clarity, and maintainability is justified given the critical nature of the enrollment process.