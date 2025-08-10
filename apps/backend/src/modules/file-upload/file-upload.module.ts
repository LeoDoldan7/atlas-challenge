import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadRepository } from './file-upload.repository';
import { MinioModule } from '../minio/minio.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [MinioModule],
  providers: [FileUploadService, FileUploadRepository, PrismaService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
