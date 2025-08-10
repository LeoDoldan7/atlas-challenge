import { Module } from '@nestjs/common';
import { PlanActivationService } from './plan-activation.service';
import { PlanActivationRepository } from './plan-activation.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [PlanActivationService, PlanActivationRepository, PrismaService],
  exports: [PlanActivationService],
})
export class PlanActivationModule {}
