import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionStatus } from '../../graphql/types/enums';

@Injectable()
export class FileUploadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSubscriptionWithFiles(subscriptionId: string) {
    return this.prisma.healthcareSubscription.findUnique({
      where: { id: BigInt(subscriptionId) },
      include: { files: true },
    });
  }

  async createFilesTransaction(
    subscriptionId: bigint,
    files: Array<{
      path: string;
      original_name: string;
      file_size_bytes: number;
      mime_type: string;
      url: string;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const uploadedFiles: Array<{
        id: bigint;
        healthcare_subscription_id: bigint;
        path: string;
        original_name: string;
        file_size_bytes: number;
        mime_type: string;
        created_at: Date;
        url: string;
      }> = [];

      for (const file of files) {
        // Save file record to database
        const fileRecord = await tx.healthcareSubscriptionFile.create({
          data: {
            healthcare_subscription_id: subscriptionId,
            path: file.path,
            original_name: file.original_name,
            file_size_bytes: file.file_size_bytes,
            mime_type: file.mime_type,
          },
        });

        uploadedFiles.push({
          ...fileRecord,
          url: file.url, // Include the presigned URL for immediate access
        });
      }

      // Update subscription status to next stage
      const subscription = await tx.healthcareSubscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.PLAN_ACTIVATION_PENDING },
      });

      return {
        subscription,
        uploadedFiles,
      };
    });
  }
}
