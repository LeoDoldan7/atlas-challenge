import { Injectable } from '@nestjs/common';
import { Employee } from '../../graphql/employee/types/employee.type';
import { MaritalStatus } from '../../graphql/shared/enums';
import { EmployeeWithDemographics } from './employee.repository';
import { MaritalStatus as PrismaMaritalStatus } from '@prisma/client';

@Injectable()
export class EmployeeMapper {
  toGraphQL(employee: EmployeeWithDemographics): Employee {
    return {
      id: employee.id.toString(),
      companyId: employee.company_id.toString(),
      demographicsId: employee.demographics_id.toString(),
      email: employee.email,
      birthDate: employee.birth_date,
      maritalStatus: this.mapPrismaMaritalStatus(employee.marital_status),
      createdAt: employee.created_at,
      demographic: {
        id: employee.demographics.id.toString(),
        firstName: employee.demographics.first_name,
        lastName: employee.demographics.last_name,
        governmentId: employee.demographics.government_id,
        birthDate: employee.demographics.birth_date,
        createdAt: employee.demographics.created_at,
      },
      wallet: employee.wallet ? {
        id: employee.wallet.id.toString(),
        employeeId: employee.id.toString(),
        balanceCents: employee.wallet.balance_cents.toString(),
        currencyCode: employee.wallet.currency_code,
        createdAt: employee.wallet.created_at,
        employee: null as any, // Avoid circular reference
      } : undefined,
    };
  }

  private mapPrismaMaritalStatus(
    prismaStatus: PrismaMaritalStatus,
  ): MaritalStatus {
    switch (prismaStatus) {
      case PrismaMaritalStatus.single:
        return MaritalStatus.SINGLE;
      case PrismaMaritalStatus.married:
        return MaritalStatus.MARRIED;
      case PrismaMaritalStatus.divorced:
        return MaritalStatus.DIVORCED;
      case PrismaMaritalStatus.widowed:
        return MaritalStatus.WIDOWED;
      case PrismaMaritalStatus.separated:
        return MaritalStatus.SEPARATED;
      default:
        return MaritalStatus.SINGLE;
    }
  }
}
