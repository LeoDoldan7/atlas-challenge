import { Module } from '@nestjs/common';
import { EmployeeResolver } from './employee.resolver';
import { EmployeeService } from './employee.service';
import { EmployeeRepository } from './employee.repository';
import { EmployeeMapper } from './employee.mapper';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [
    EmployeeResolver,
    EmployeeService,
    EmployeeRepository,
    EmployeeMapper,
    PrismaService,
  ],
  exports: [EmployeeService, EmployeeMapper],
})
export class EmployeeModule {}
