import { Module } from '@nestjs/common';
import { HealthcareSubscriptionResolver } from './healthcare-subscription.resolver';
import { HealthcareSubscriptionService } from './healthcare-subscription.service';
import { HealthcareSubscriptionRepository } from './healthcare-subscription.repository';
import { HealthcareSubscriptionMapper } from './healthcare-subscription.mapper';
import { HealthcarePlanModule } from '../healthcare-plan/healthcare-plan.module';
import { EmployeeModule } from '../employee/employee.module';
import { FamilyDemographicsModule } from '../family-demographics/family-demographics.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { PlanActivationModule } from '../plan-activation/plan-activation.module';
import { MinioModule } from '../minio/minio.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [
    HealthcarePlanModule,
    EmployeeModule,
    FamilyDemographicsModule,
    FileUploadModule,
    PlanActivationModule,
    MinioModule,
  ],
  providers: [
    HealthcareSubscriptionResolver,
    HealthcareSubscriptionService,
    HealthcareSubscriptionRepository,
    HealthcareSubscriptionMapper,
    PrismaService,
  ],
  exports: [HealthcareSubscriptionService],
})
export class HealthcareSubscriptionModule {}
