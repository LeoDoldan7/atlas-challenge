import { Module } from '@nestjs/common';
import { EmployeeResolver } from '../../graphql/employee/resolver/employee.resolver';
import { EmployeeService } from './employee.service';
import { EmployeeRepository } from './employee.repository';
import { EmployeeMapper } from './employee.mapper';
import { PrismaService } from '../../prisma/prisma.service';
import { DemographicMapper } from '../demographic/demographic.mapper';
import { WalletMapper } from '../wallet/wallet.mapper';

@Module({
  providers: [
    EmployeeResolver,
    EmployeeService,
    EmployeeRepository,
    EmployeeMapper,
    DemographicMapper,
    WalletMapper,
    PrismaService,
  ],
  exports: [EmployeeService, EmployeeMapper],
})
export class EmployeeModule {}
