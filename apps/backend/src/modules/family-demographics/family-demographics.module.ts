import { Module } from '@nestjs/common';
import { FamilyDemographicsService } from './family-demographics.service';
import { FamilyDemographicsRepository } from './family-demographics.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [
    FamilyDemographicsService,
    FamilyDemographicsRepository,
    PrismaService,
  ],
  exports: [FamilyDemographicsService],
})
export class FamilyDemographicsModule {}
