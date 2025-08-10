import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { minioConfig } from '../../config/minio.config';
import { Readable } from 'stream';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: minioConfig.endPoint,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
      region: minioConfig.region,
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    const bucketExists = await this.minioClient.bucketExists(
      minioConfig.bucketName,
    );
    if (!bucketExists) {
      await this.minioClient.makeBucket(
        minioConfig.bucketName,
        minioConfig.region,
      );
      console.log(`✅ Created MinIO bucket: ${minioConfig.bucketName}`);
    }
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    subscriptionId: string,
  ): Promise<{
    path: string;
    url: string;
  }> {
    // Create a unique file path with subscription ID prefix
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `subscriptions/${subscriptionId}/${timestamp}-${fileName}`;

    // Convert buffer to stream
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Upload file to MinIO
    await this.minioClient.putObject(
      minioConfig.bucketName,
      filePath,
      stream,
      buffer.length,
      {
        'Content-Type': mimeType,
      },
    );

    // Generate presigned URL for file access (valid for 24 hours)
    const url = await this.minioClient.presignedGetObject(
      minioConfig.bucketName,
      filePath,
      24 * 60 * 60, // 24 hours
    );

    return {
      path: filePath,
      url,
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    await this.minioClient.removeObject(minioConfig.bucketName, filePath);
  }

  async getFileUrl(
    filePath: string,
    expiry: number = 24 * 60 * 60,
  ): Promise<string> {
    return await this.minioClient.presignedGetObject(
      minioConfig.bucketName,
      filePath,
      expiry,
    );
  }

  async listFiles(prefix: string): Promise<string[]> {
    const files: string[] = [];
    const objectsStream = this.minioClient.listObjects(
      minioConfig.bucketName,
      prefix,
      true,
    );

    return new Promise((resolve, reject) => {
      objectsStream.on('data', (obj) => {
        if (obj.name) {
          files.push(obj.name);
        }
      });

      objectsStream.on('error', (err) => {
        reject(err);
      });

      objectsStream.on('end', () => {
        resolve(files);
      });
    });
  }
}
