import { Resolver, Query, Args } from '@nestjs/graphql';
import { Employee } from '../types/employee.type';
import { MaritalStatus } from '../types/enums';
import { PrismaService } from '../../prisma/prisma.service';

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
