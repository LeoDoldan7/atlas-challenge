import { TestSetup } from './utils/test-setup';

describe('Error Handling (e2e)', () => {
  beforeAll(async () => {
    await TestSetup.setup();
  });

  afterAll(async () => {
    await TestSetup.cleanup();
  });

  describe('Error Handling', () => {
    it('should handle missing required fields in createSubscription', async () => {
      const mutation = `
        mutation CreateSubscription($input: CreateSubscriptionInput!) {
          createSubscription(createSubscriptionInput: $input) {
            id
          }
        }
      `;

      const response = await TestSetup.graphqlQuery(mutation, {
        input: { employeeId: 1 }, // Missing required fields
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors?.[0].message).toContain('includeSpouse');
    });

    it('should handle non-existent subscription ID', async () => {
      const query = `
        query GetSubscriptionStatus($subscriptionId: String!) {
          getSubscriptionStatus(subscriptionId: $subscriptionId) {
            id
          }
        }
      `;

      const response = await TestSetup.graphqlQuery(query, {
        subscriptionId: '999999',
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle invalid file data in uploadFiles', async () => {
      const { subscriptionIds } = TestSetup.getContext();

      const mutation = `
        mutation UploadFiles($input: UploadFilesInput!) {
          uploadFiles(uploadFilesInput: $input) {
            id
          }
        }
      `;

      const input = {
        subscriptionId: subscriptionIds[0],
        files: [
          {
            filename: 'invalid.txt',
            mimetype: 'text/plain',
            data: 'invalid-base64-data', // Invalid base64
          },
        ],
      };

      const response = await TestSetup.graphqlQuery(mutation, { input });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });
  });
});
