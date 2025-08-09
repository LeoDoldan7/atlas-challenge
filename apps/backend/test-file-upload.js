const fs = require('fs');
const path = require('path');

// Create a simple test PDF file content (base64)
const testFileContent = Buffer.from('Test document content for healthcare subscription').toString('base64');

const uploadFilesQuery = `
  mutation UploadFiles($uploadFilesInput: UploadFilesInput!) {
    uploadFiles(uploadFilesInput: $uploadFilesInput) {
      id
      status
      files {
        id
        originalName
        fileSizeBytes
        mimeType
        path
      }
    }
  }
`;

const variables = {
  uploadFilesInput: {
    subscriptionId: "2", // The document_upload_pending subscription
    files: [
      {
        filename: "medical-form.txt",
        mimetype: "text/plain",
        data: testFileContent
      }
    ]
  }
};

console.log('Test GraphQL mutation:');
console.log(JSON.stringify({ query: uploadFilesQuery, variables }, null, 2));

console.log('\nTo test this mutation:');
console.log('1. Start the backend server: npm run start:dev');
console.log('2. Go to http://localhost:3000/graphql');
console.log('3. Copy and paste the above mutation');
console.log('4. Expected result: subscription status changes to PLAN_ACTIVATION_PENDING');