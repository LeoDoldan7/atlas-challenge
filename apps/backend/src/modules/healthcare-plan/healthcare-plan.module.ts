import { Module } from '@nestjs/common';
import { HealthcarePlanResolver } from '../../graphql/healthcare-plan/resolver/healthcare-plan.resolver';
import { HealthcarePlanService } from './healthcare-plan.service';
import { HealthcarePlanRepository } from './healthcare-plan.repository';
import { HealthcarePlanMapper } from './healthcare-plan.mapper';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [
    HealthcarePlanResolver,
    HealthcarePlanService,
    HealthcarePlanRepository,
    HealthcarePlanMapper,
    PrismaService,
  ],
  exports: [HealthcarePlanService, HealthcarePlanMapper],
})
export class HealthcarePlanModule {}
