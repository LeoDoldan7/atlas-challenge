# File Upload Testing Guide

## Frontend File Upload Implementation Complete! 🎉

The frontend now supports file upload with the following features:

### ✅ Implemented Features

1. **File Selection**
   - Hidden file input with custom button trigger
   - File type validation (PDF, images, Word docs)
   - File size validation (10MB max)
   - Real-time feedback with toast notifications

2. **File Preview**
   - Shows selected file name, size, and type
   - Remove button to clear selection
   - Upload button to submit to backend

3. **Upload Process**
   - Converts file to base64 for GraphQL transmission
   - Calls uploadFiles mutation with proper input format
   - Shows loading state during upload
   - Success/error handling with user feedback

4. **State Management**
   - Tracks selected file and upload status
   - Clears state after successful upload
   - Refetches subscription data to show updated status

### 🎯 How to Test

1. **Prerequisites:**
   - Backend server running (`npm run start:dev`)
   - MinIO container running (`docker-compose -f docker-compose.minio.yml up -d`)
   - Database seeded with test subscriptions (`npm run db:seed`)

2. **Test Steps:**
   - Navigate to subscription details page for subscription ID 2 (DOCUMENT_UPLOAD_PENDING status)
   - Click "Choose File" button
   - Select a PDF, image, or Word document (under 10MB)
   - Click "Upload" button
   - Verify file uploads successfully and subscription status changes to PLAN_ACTIVATION_PENDING

### 🔧 Technical Implementation

- **Base64 Encoding**: Files converted to base64 for GraphQL compatibility
- **Validation**: Client-side validation for file type and size
- **Error Handling**: Comprehensive error messages for user feedback  
- **State Management**: React hooks for managing upload state
- **GraphQL Integration**: Uses uploadFiles mutation with proper input types
- **MinIO Storage**: Files stored in MinIO S3-compatible storage

The complete file upload workflow is now functional from frontend selection to backend storage! 🚀