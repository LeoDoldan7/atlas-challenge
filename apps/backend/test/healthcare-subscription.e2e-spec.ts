import { TestSetup } from './utils/test-setup';
import {
  CreateSubscriptionMutationResponse,
  SubscriptionsQueryResponse,
  SubscriptionStatusQueryResponse,
  UploadFilesMutationResponse,
  UploadFamilyDemographicsMutationResponse,
  ActivatePlanMutationResponse,
} from './types/graphql.types';

describe('Healthcare Subscription Resolver (e2e)', () => {
  beforeAll(async () => {
    await TestSetup.setup();
  });

  afterAll(async () => {
    await TestSetup.cleanup();
  });

  describe('Healthcare Subscriptions', () => {
    it('should create a new subscription', async () => {
      const { employeeIds, planIds, subscriptionIds } = TestSetup.getContext();

      const mutation = `
        mutation CreateSubscription($input: CreateSubscriptionInput!) {
          createSubscription(createSubscriptionInput: $input) {
            id
            type
            status
            employee {
              id
              email
            }
            plan {
              id
              name
            }
            items {
              id
              role
            }
          }
        }
      `;

      const input = {
        employeeId: parseFloat(employeeIds[1]),
        planId: parseFloat(planIds[0]),
        includeSpouse: false,
        numOfChildren: 0,
      };

      const response =
        await TestSetup.graphqlQuery<CreateSubscriptionMutationResponse>(
          mutation,
          { input },
        );

      expect(response.status).toBe(200);

      // Explicit null checks to prevent silent failures
      if (!response.body.data) {
        fail('Expected response.body.data to be defined');
      }
      if (!response.body.data.createSubscription) {
        fail('Expected createSubscription to be defined');
      }

      const subscription = response.body.data.createSubscription;
      expect(subscription.type).toBe('INDIVIDUAL');
      expect(subscription.status).toBe('DEMOGRAPHIC_VERIFICATION_PENDING');

      if (!subscription.items) {
        fail('Expected subscription to have items');
      }
      expect(subscription.items.length).toBe(1);
      expect(subscription.items[0]?.role).toBe('EMPLOYEE');
      subscriptionIds.push(subscription.id);
    });

    it('should create a family subscription', async () => {
      const { companyId, planIds, subscriptionIds, employeeIds, prisma } =
        TestSetup.getContext();

      // First create another employee for this test
      const demographic = await prisma.demographic.create({
        data: {
          first_name: 'Family',
          last_name: 'Test',
          government_id: `SSN-FAMILY-001-${Date.now()}`,
          birth_date: new Date('1980-01-01'),
        },
      });

      const employee = await prisma.employee.create({
        data: {
          company_id: BigInt(companyId),
          demographics_id: demographic.id,
          email: `family.test.${Date.now()}@test.com`,
          birth_date: new Date('1980-01-01'),
          marital_status: 'married',
        },
      });

      await prisma.wallet.create({
        data: {
          employee_id: employee.id,
          balance_cents: BigInt(100000),
          currency_code: 'USD',
        },
      });

      const mutation = `
        mutation CreateSubscription($input: CreateSubscriptionInput!) {
          createSubscription(createSubscriptionInput: $input) {
            id
            type
            items {
              role
            }
          }
        }
      `;

      const input = {
        employeeId: Number(employee.id),
        planId: parseFloat(planIds[0]),
        includeSpouse: true,
        numOfChildren: 2,
      };

      const response =
        await TestSetup.graphqlQuery<CreateSubscriptionMutationResponse>(
          mutation,
          { input },
        );

      expect(response.status).toBe(200);

      // Explicit null checks to prevent silent failures
      if (!response.body.data) {
        fail('Expected response.body.data to be defined');
      }
      if (!response.body.data.createSubscription) {
        fail('Expected createSubscription to be defined');
      }

      const subscription = response.body.data.createSubscription;
      expect(subscription.type).toBe('FAMILY');

      if (!subscription.items) {
        fail('Expected subscription to have items');
      }
      expect(subscription.items.length).toBe(4); // employee + spouse + 2 children

      const roles = subscription.items.map((item) => item.role);
      expect(roles).toContain('EMPLOYEE');
      expect(roles).toContain('SPOUSE');
      expect(roles.filter((role) => role === 'CHILD').length).toBe(2);

      subscriptionIds.push(subscription.id);
      employeeIds.push(employee.id.toString());
    });

    it('should get all subscriptions', async () => {
      const query = `
        query GetSubscriptions {
          getSubscriptions {
            id
            type
            status
            startDate
            employee {
              id
              demographic {
                firstName
                lastName
              }
            }
            plan {
              name
            }
          }
        }
      `;

      const response =
        await TestSetup.graphqlQuery<SubscriptionsQueryResponse>(query);

      expect(response.status).toBe(200);

      // Explicit null checks to prevent silent failures
      if (!response.body.data) {
        fail('Expected response.body.data to be defined');
      }
      if (!response.body.data.getSubscriptions) {
        fail('Expected getSubscriptions to be defined');
      }

      expect(response.body.data.getSubscriptions).toBeInstanceOf(Array);
      expect(response.body.data.getSubscriptions.length).toBeGreaterThan(0);
    });

    it('should get subscriptions filtered by employee ID', async () => {
      const { employeeIds } = TestSetup.getContext();

      const query = `
        query GetSubscriptions($employeeId: String!) {
          getSubscriptions(employeeId: $employeeId) {
            id
            employee {
              id
            }
          }
        }
      `;

      const response = await TestSetup.graphqlQuery<SubscriptionsQueryResponse>(
        query,
        {
          employeeId: employeeIds[0],
        },
      );

      expect(response.status).toBe(200);

      // Explicit null checks to prevent silent failures
      if (!response.body.data) {
        fail('Expected response.body.data to be defined');
      }
      if (!response.body.data.getSubscriptions) {
        fail('Expected getSubscriptions to be defined');
      }

      expect(response.body.data.getSubscriptions).toBeInstanceOf(Array);
      response.body.data.getSubscriptions.forEach((sub) => {
        expect(sub.employee?.id).toBe(employeeIds[0]);
      });
    });

    it('should get subscription status details', async () => {
      const { subscriptionIds } = TestSetup.getContext();

      const query = `
        query GetSubscriptionStatus($subscriptionId: String!) {
          getSubscriptionStatus(subscriptionId: $subscriptionId) {
            id
            status
            type
            items {
              id
              role
              demographic {
                firstName
                lastName
              }
            }
            files {
              id
              originalName
              mimeType
            }
          }
        }
      `;

      const response =
        await TestSetup.graphqlQuery<SubscriptionStatusQueryResponse>(query, {
          subscriptionId: subscriptionIds[0],
        });

      expect(response.status).toBe(200);

      // Explicit null checks to prevent silent failures
      if (!response.body.data) {
        fail('Expected response.body.data to be defined');
      }
      if (!response.body.data.getSubscriptionStatus) {
        fail('Expected getSubscriptionStatus to be defined');
      }

      const status = response.body.data.getSubscriptionStatus;
      expect(status.id).toBe(subscriptionIds[0]);
    });

    it('should upload files to subscription', async () => {
      const { subscriptionIds } = TestSetup.getContext();

      const mutation = `
        mutation UploadFiles($input: UploadFilesInput!) {
          uploadFiles(uploadFilesInput: $input) {
            id
            status
            files {
              id
              originalName
              mimeType
              fileSizeBytes
            }
          }
        }
      `;

      const input = {
        subscriptionId: subscriptionIds[0],
        files: [
          {
            filename: 'test-document.pdf',
            mimetype: 'application/pdf',
            data: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKdHJhaWxlcgo8PAovUm9vdCAxIDAgUgo+PgokJUVPRgo=', // Simple PDF base64
          },
        ],
      };

      const response =
        await TestSetup.graphqlQuery<UploadFilesMutationResponse>(mutation, {
          input,
        });

      expect(response.status).toBe(200);

      // Explicit null checks to prevent silent failures
      if (!response.body.data) {
        fail('Expected response.body.data to be defined');
      }
      if (!response.body.data.uploadFiles) {
        fail('Expected uploadFiles to be defined');
      }

      const result = response.body.data.uploadFiles;
      if (!result.files) {
        fail('Expected result to have files');
      }
      expect(result.files.length).toBe(1);
      expect(result.files[0]?.originalName).toBe('test-document.pdf');
    });

    it('should upload family demographics', async () => {
      const { subscriptionIds } = TestSetup.getContext();

      const mutation = `
        mutation UploadFamilyDemographics($input: UploadFamilyDemographicsInput!) {
          uploadFamilyDemographics(uploadFamilyDemographicsInput: $input) {
            id
            status
            items {
              id
              role
              demographic {
                firstName
                lastName
                governmentId
              }
            }
          }
        }
      `;

      const input = {
        subscriptionId: subscriptionIds[1], // Use the family subscription in demographic_verification_pending status
        familyMembers: [
          {
            role: 'SPOUSE',
            demographic: {
              firstName: 'Jane',
              lastName: 'Spouse',
              governmentId: `SSN-SPOUSE-001-${Date.now()}`,
              birthDate: '1987-05-15T00:00:00Z',
            },
          },
        ],
      };

      const response =
        await TestSetup.graphqlQuery<UploadFamilyDemographicsMutationResponse>(
          mutation,
          { input },
        );

      expect(response.status).toBe(200);

      // Explicit null checks to prevent silent failures
      if (!response.body.data) {
        fail('Expected response.body.data to be defined');
      }
      if (!response.body.data.uploadFamilyDemographics) {
        fail('Expected uploadFamilyDemographics to be defined');
      }

      const result = response.body.data.uploadFamilyDemographics;
      if (!result.items) {
        fail('Expected result to have items');
      }

      const spouseItem = result.items.find((item) => item.role === 'SPOUSE');
      if (!spouseItem) {
        fail('Expected to find spouse item');
      }

      if (spouseItem.demographic) {
        expect(spouseItem.demographic.firstName).toBe('Jane');
      } else {
        // The demographic was successfully uploaded, check status changed
        expect(result.status).toBe('DOCUMENT_UPLOAD_PENDING');
      }
    });

    it('should activate a plan', async () => {
      const { employeeIds, companyId, planIds, subscriptionIds, prisma } =
        TestSetup.getContext();

      // First, create a subscription in plan_activation_pending status
      const activationSubscription = await prisma.healthcareSubscription.create(
        {
          data: {
            employee_id: BigInt(employeeIds[0]),
            company_id: BigInt(companyId),
            plan_id: BigInt(planIds[0]),
            type: 'individual',
            status: 'plan_activation_pending',
            start_date: new Date(),
            billing_anchor: 1,
          },
        },
      );
      subscriptionIds.push(activationSubscription.id.toString());

      // Create subscription item
      await prisma.healthcareSubscriptionItem.create({
        data: {
          healthcare_subscription_id: activationSubscription.id,
          role: 'employee',
          demographic_id: BigInt(employeeIds[0]),
        },
      });

      // Add a required document to satisfy the validation
      await prisma.healthcareSubscriptionFile.create({
        data: {
          healthcare_subscription_id: activationSubscription.id,
          path: 'test/document.pdf',
          original_name: 'document.pdf',
          file_size_bytes: 1024,
          mime_type: 'application/pdf',
        },
      });

      const mutation = `
        mutation ActivatePlan($input: ActivatePlanInput!) {
          activatePlan(activatePlanInput: $input) {
            id
            status
            startDate
          }
        }
      `;

      const input = {
        subscriptionId: activationSubscription.id.toString(),
      };

      const response =
        await TestSetup.graphqlQuery<ActivatePlanMutationResponse>(mutation, {
          input,
        });

      expect(response.status).toBe(200);

      // Explicit null checks to prevent silent failures
      if (!response.body.data) {
        fail('Expected response.body.data to be defined');
      }
      if (!response.body.data.activatePlan) {
        fail('Expected activatePlan to be defined');
      }

      const plan = response.body.data.activatePlan;
      expect(plan.status).toBe('ACTIVE');
      expect(plan.startDate).toBeDefined();
    });
  });
});
