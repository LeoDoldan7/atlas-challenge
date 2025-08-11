import { TestSetup } from './utils/test-setup';
import { EmployeesByCompanyQueryResponse } from './types/graphql.types';

describe('Employee Resolver (e2e)', () => {
  beforeAll(async () => {
    await TestSetup.setup();
  });

  afterAll(async () => {
    await TestSetup.cleanup();
  });

  describe('Employees', () => {
    it('should get employees by company ID', async () => {
      const { companyId } = TestSetup.getContext();

      const query = `
        query GetEmployees($companyId: String!) {
          employeesByCompany(companyId: $companyId) {
            id
            email
            birthDate
            maritalStatus
            demographic {
              id
              firstName
              lastName
              governmentId
            }
            wallet {
              id
              balanceCents
              currencyCode
            }
          }
        }
      `;

      const response =
        await TestSetup.graphqlQuery<EmployeesByCompanyQueryResponse>(query, {
          companyId,
        });

      expect(response.status).toBe(200);

      // Explicit null checks to prevent silent failures
      if (!response.body.data) {
        fail('Expected response.body.data to be defined');
      }
      if (!response.body.data.employeesByCompany) {
        fail('Expected employeesByCompany to be defined');
      }

      expect(response.body.data.employeesByCompany).toBeInstanceOf(Array);
      expect(response.body.data.employeesByCompany.length).toBe(2);

      const employee = response.body.data.employeesByCompany[0];
      if (!employee) {
        fail('Expected first employee to be defined');
      }

      expect(employee.email).toContain('test.employee1');
      expect(employee.demographic.firstName).toBe('Test');

      if (!employee.wallet) {
        fail('Expected employee to have a wallet');
      }
      expect(employee.wallet.balanceCents).toBe('50000');
    });

    it('should handle invalid company ID', async () => {
      const query = `
        query GetEmployees($companyId: String!) {
          employeesByCompany(companyId: $companyId) {
            id
          }
        }
      `;

      const response =
        await TestSetup.graphqlQuery<EmployeesByCompanyQueryResponse>(query, {
          companyId: '999999',
        });

      expect(response.status).toBe(200);
      expect(response.body.data?.employeesByCompany).toEqual([]);
    });
  });
});
