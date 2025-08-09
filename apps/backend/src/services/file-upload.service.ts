import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from './minio.service';
import { UploadFilesInput, FileInput } from '../graphql/dto/upload-files.input';
import { SubscriptionStatus } from '../graphql/types/enums';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  async uploadFiles(input: UploadFilesInput) {
    // Validate subscription exists and is in correct status
    const subscription = await this.prisma.healthcareSubscription.findUnique({
      where: { id: BigInt(input.subscriptionId) },
      include: { files: true },
    });

    if (!subscription) {
      throw new Error('Healthcare subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.DOCUMENT_UPLOAD_PENDING) {
      throw new Error('Subscription is not in document upload pending status');
    }

    // Validate files
    this.validateFiles(input.files);

    // Process files and update subscription in a transaction
    return await this.prisma.$transaction(async (tx) => {
      const uploadedFiles: any[] = [];

      for (const file of input.files) {
        // Convert base64 to buffer
        const buffer = Buffer.from(file.data, 'base64');

        // Upload to MinIO
        const { path, url } = await this.minioService.uploadFile(
          buffer,
          file.filename,
          file.mimetype,
          input.subscriptionId,
        );

        // Save file record to database
        const fileRecord = await tx.healthcareSubscriptionFile.create({
          data: {
            healthcare_subscription_id: subscription.id,
            path,
            original_name: file.filename,
            file_size_bytes: buffer.length,
            mime_type: file.mimetype,
          },
        });

        uploadedFiles.push({
          ...fileRecord,
          url, // Include the presigned URL for immediate access
        });
      }

      // Update subscription status to next stage
      await tx.healthcareSubscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.PLAN_ACTIVATION_PENDING },
      });

      return {
        subscription,
        uploadedFiles,
      };
    });
  }

  private validateFiles(files: FileInput[]) {
    if (!files || files.length === 0) {
      throw new Error('At least one file is required');
    }

    if (files.length > 10) {
      throw new Error('Maximum of 10 files allowed');
    }

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(
          `File type ${file.mimetype} not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
        );
      }

      // Validate base64 data and estimated size
      try {
        const buffer = Buffer.from(file.data, 'base64');
        if (buffer.length > maxFileSize) {
          throw new Error(`File ${file.filename} exceeds maximum size of 10MB`);
        }
      } catch {
        throw new Error(`Invalid file data for ${file.filename}`);
      }
    }
  }
}
