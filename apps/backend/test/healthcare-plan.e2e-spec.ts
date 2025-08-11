import { TestSetup } from './utils/test-setup';
import {
  HealthcarePlan,
  HealthcarePlansQueryResponse,
} from './types/graphql.types';

describe('Healthcare Plan Resolver (e2e)', () => {
  beforeAll(async () => {
    await TestSetup.setup();
  });

  afterAll(async () => {
    await TestSetup.cleanup();
  });

  describe('Healthcare Plans', () => {
    it('should get all healthcare plans', async () => {
      const query = `
        query {
          healthcarePlans {
            id
            name
            costEmployeeCents
            costSpouseCents
            costChildCents
            pctEmployeePaidByCompany
            pctSpousePaidByCompany
            pctChildPaidByCompany
          }
        }
      `;

      const response =
        await TestSetup.graphqlQuery<HealthcarePlansQueryResponse>(query);

      expect(response.status).toBe(200);

      // Explicit null checks to prevent silent failures
      if (!response.body.data) {
        fail('Expected response.body.data to be defined');
      }
      if (!response.body.data.healthcarePlans) {
        fail('Expected healthcarePlans to be defined');
      }

      expect(response.body.data.healthcarePlans).toBeInstanceOf(Array);
      expect(response.body.data.healthcarePlans.length).toBeGreaterThan(0);

      const plan = response.body.data.healthcarePlans.find(
        (p: HealthcarePlan) => p.name.includes('E2E Basic Plan'),
      );

      if (!plan) {
        fail('Expected to find a plan with name containing "E2E Basic Plan"');
      }

      expect(plan.costEmployeeCents).toBe('12000');
    });
  });
});
