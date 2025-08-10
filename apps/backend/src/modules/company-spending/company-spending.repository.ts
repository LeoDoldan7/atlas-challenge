import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const companySelect = {
  id: true,
  name: true,
} as const;

const subscriptionWithRelationsInclude = {
  plan: true,
  employee: {
    include: {
      demographics: true,
    },
  },
  items: true,
} as const;

export type CompanySelect = Prisma.CompanyGetPayload<{
  select: typeof companySelect;
}>;

export type SubscriptionWithRelations =
  Prisma.HealthcareSubscriptionGetPayload<{
    include: typeof subscriptionWithRelationsInclude;
  }>;

@Injectable()
export class CompanySpendingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCompanyById(companyId: string): Promise<CompanySelect | null> {
    return this.prisma.company.findUnique({
      where: { id: BigInt(companyId) },
      select: companySelect,
    });
  }

  async findSubscriptionsByCompanyId(
    companyId: string,
  ): Promise<SubscriptionWithRelations[]> {
    return this.prisma.healthcareSubscription.findMany({
      where: {
        company_id: BigInt(companyId),
        status: 'active',
      },
      include: subscriptionWithRelationsInclude,
    });
  }
}
