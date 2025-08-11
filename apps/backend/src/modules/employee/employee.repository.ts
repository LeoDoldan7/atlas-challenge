import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const employeeWithDemographicsSelect = {
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
  wallet: {
    select: {
      id: true,
      balance_cents: true,
      currency_code: true,
      created_at: true,
    },
  },
} as const;

export type EmployeeWithDemographics = Prisma.EmployeeGetPayload<{
  select: typeof employeeWithDemographicsSelect;
}>;

@Injectable()
export class EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCompanyId(
    companyId: string,
  ): Promise<EmployeeWithDemographics[]> {
    return this.prisma.employee.findMany({
      where: {
        company_id: BigInt(companyId),
      },
      select: employeeWithDemographicsSelect,
    });
  }
}
