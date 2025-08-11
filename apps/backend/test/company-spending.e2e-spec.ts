import { TestSetup } from './utils/test-setup';
import { CompanySpendingQueryResponse } from './types/graphql.types';

describe('Company Spending Resolver (e2e)', () => {
  beforeAll(async () => {
    await TestSetup.setup();
  });

  afterAll(async () => {
    await TestSetup.cleanup();
  });

  describe('Company Spending', () => {
    it('should get company spending statistics', async () => {
      const { companyId } = TestSetup.getContext();

      const query = `
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

      const response =
        await TestSetup.graphqlQuery<CompanySpendingQueryResponse>(query, {
          companyId,
        });

      expect(response.status).toBe(200);

      // Explicit null checks to prevent silent failures
      if (!response.body.data) {
        fail('Expected response.body.data to be defined');
      }
      if (!response.body.data.getCompanySpendingStatistics) {
        fail('Expected getCompanySpendingStatistics to be defined');
      }

      const stats = response.body.data.getCompanySpendingStatistics;
      expect(stats.companyId).toBe(companyId);
      expect(stats.companyName).toContain('Test Company E2E');
      expect(stats.employeeBreakdown).toBeInstanceOf(Array);
      expect(stats.planBreakdown).toBeInstanceOf(Array);
    });

    it('should handle invalid company ID for spending statistics', async () => {
      const query = `
        query GetCompanySpendingStatistics($companyId: String!) {
          getCompanySpendingStatistics(companyId: $companyId) {
            companyId
          }
        }
      `;

      const response =
        await TestSetup.graphqlQuery<CompanySpendingQueryResponse>(query, {
          companyId: '999999',
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });
  });
});
