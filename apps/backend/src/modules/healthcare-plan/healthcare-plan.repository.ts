import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const healthcarePlanSelect = {
  id: true,
  name: true,
  cost_employee_cents: true,
  pct_employee_paid_by_company: true,
  cost_spouse_cents: true,
  pct_spouse_paid_by_company: true,
  cost_child_cents: true,
  pct_child_paid_by_company: true,
} as const;

export type HealthcarePlanSelect = Prisma.HealthcarePlanGetPayload<{
  select: typeof healthcarePlanSelect;
}>;

@Injectable()
export class HealthcarePlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<HealthcarePlanSelect[]> {
    return this.prisma.healthcarePlan.findMany({
      select: healthcarePlanSelect,
    });
  }
}
