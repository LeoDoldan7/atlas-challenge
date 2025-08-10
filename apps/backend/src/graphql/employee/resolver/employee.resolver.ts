import { Resolver, Query, Args } from '@nestjs/graphql';
import { Employee } from '../types/employee.type';
import { MaritalStatus } from '../../shared/enums';
import { PrismaService } from '../../../prisma/prisma.service';

@Resolver(() => Employee)
export class EmployeeResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [Employee], {
    name: 'employeesByCompany',
    description: 'Get employees by company ID',
  })
  async employeesByCompany(
    @Args('companyId', { type: () => String }) companyId: string,
  ): Promise<Employee[]> {
    const employees = await this.prisma.employee.findMany({
      where: {
        company_id: BigInt(companyId),
      },
      select: {
        id: true,
        company_id: true,
        demographics_id: true,
        email: true,
        birth_date: true,
        marital_status: true,
        created_at: true,
        demographics: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            government_id: true,
            birth_date: true,
            created_at: true,
          },
        },
      },
    });

    return employees.map((employee) => ({
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
    }));
  }

  private mapPrismaMaritalStatus(prismaStatus: string): MaritalStatus {
    switch (prismaStatus) {
      case 'single':
        return MaritalStatus.SINGLE;
      case 'married':
        return MaritalStatus.MARRIED;
      case 'divorced':
        return MaritalStatus.DIVORCED;
      case 'widowed':
        return MaritalStatus.WIDOWED;
      case 'separated':
        return MaritalStatus.SEPARATED;
      default:
        return MaritalStatus.SINGLE;
    }
  }
}
