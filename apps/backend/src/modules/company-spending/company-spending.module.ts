import { Module } from '@nestjs/common';
import { CompanySpendingResolver } from './company-spending.resolver';
import { CompanySpendingService } from './company-spending.service';
import { CompanySpendingRepository } from './company-spending.repository';
import { CompanySpendingMapper } from './company-spending.mapper';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [
    CompanySpendingResolver,
    CompanySpendingService,
    CompanySpendingRepository,
    CompanySpendingMapper,
    PrismaService,
  ],
  exports: [CompanySpendingService],
})
export class CompanySpendingModule {}
