import { Injectable } from '@nestjs/common';
import { FileUploadRepository } from './file-upload.repository';
import { MinioService } from '../minio/minio.service';
import {
  UploadFilesInput,
  FileInput,
} from '../../graphql/healthcare-subscription/dto/upload-files.input';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly repository: FileUploadRepository,
    private readonly minioService: MinioService,
  ) {}

  async uploadFiles(input: UploadFilesInput) {
    const subscription = await this.repository.findSubscriptionWithFiles(
      input.subscriptionId,
    );

    if (!subscription) {
      throw new Error('Healthcare subscription not found');
    }

    if (subscription.status !== 'PENDING') {
      throw new Error('Subscription is not in pending status');
    }

    this.validateFiles(input.files);

    const processedFiles: Array<{
      path: string;
      original_name: string;
      file_size_bytes: number;
      mime_type: string;
      url: string;
    }> = [];
    for (const file of input.files) {
      const buffer = Buffer.from(file.data, 'base64');

      const { path, url } = await this.minioService.uploadFile(
        buffer,
        file.filename,
        file.mimetype,
        input.subscriptionId,
      );

      processedFiles.push({
        path,
        original_name: file.filename,
        file_size_bytes: buffer.length,
        mime_type: file.mimetype,
        url,
      });
    }

    return await this.repository.createFilesTransaction(
      subscription.id,
      processedFiles,
    );
  }

  private validateFiles(files: FileInput[]) {
    if (!files || files.length === 0) {
      throw new Error('At least one file is required');
    }

    if (files.length > 10) {
      throw new Error('Maximum of 10 files allowed');
    }

    const maxFileSize = 5 * 1024 * 1024; // 5MB
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

      try {
        const buffer = Buffer.from(file.data, 'base64');
        if (buffer.length > maxFileSize) {
          throw new Error(`File ${file.filename} exceeds maximum size of 5MB`);
        }
      } catch {
        throw new Error(`Invalid file data for ${file.filename}`);
      }
    }
  }
}
