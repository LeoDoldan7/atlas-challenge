import { TestSetup } from './utils/test-setup';
import { ProcessPaymentsMutationResponse } from './types/graphql.types';

describe('Payment Resolver (e2e)', () => {
  beforeAll(async () => {
    await TestSetup.setup();
  });

  afterAll(async () => {
    await TestSetup.cleanup();
  });

  describe('Payment Processing', () => {
    it('should process company payments', async () => {
      const { companyId } = TestSetup.getContext();

      const mutation = `
        mutation ProcessPayments($input: ProcessPaymentsInput!) {
          processCompanyPayments(processPaymentsInput: $input) {
            success
            totalAmountProcessed
            employeePayments {
              employeeId
              subscriptionsPaid
              amountPaid
            }
          }
        }
      `;

      const input = {
        companyId,
      };

      const response =
        await TestSetup.graphqlQuery<ProcessPaymentsMutationResponse>(
          mutation,
          { input },
        );

      expect(response.status).toBe(200);

      // Explicit null checks to prevent silent failures
      if (!response.body.data) {
        fail('Expected response.body.data to be defined');
      }
      if (!response.body.data.processCompanyPayments) {
        fail('Expected processCompanyPayments to be defined');
      }

      const result = response.body.data.processCompanyPayments;
      expect(result.success).toBe(true);
      expect(result.employeePayments).toBeInstanceOf(Array);
    });

    it('should handle payment processing for company with no active subscriptions', async () => {
      const { prisma } = TestSetup.getContext();

      // Create a company with no active subscriptions
      const emptyCompany = await prisma.company.create({
        data: {
          name: 'Empty Company E2E',
          country_iso_code: 'US',
        },
      });

      const mutation = `
        mutation ProcessPayments($input: ProcessPaymentsInput!) {
          processCompanyPayments(processPaymentsInput: $input) {
            success
            totalAmountProcessed
            employeePayments {
              employeeId
            }
          }
        }
      `;

      const response =
        await TestSetup.graphqlQuery<ProcessPaymentsMutationResponse>(
          mutation,
          { input: { companyId: emptyCompany.id.toString() } },
        );

      expect(response.status).toBe(200);

      // Explicit null checks to prevent silent failures
      if (!response.body.data) {
        fail('Expected response.body.data to be defined');
      }
      if (!response.body.data.processCompanyPayments) {
        fail('Expected processCompanyPayments to be defined');
      }

      const result = response.body.data.processCompanyPayments;
      expect(result.success).toBe(true);
      expect(result.employeePayments).toEqual([]);
      expect(result.totalAmountProcessed).toBe('0');

      // Cleanup
      await prisma.company.delete({ where: { id: emptyCompany.id } });
    });
  });
});
