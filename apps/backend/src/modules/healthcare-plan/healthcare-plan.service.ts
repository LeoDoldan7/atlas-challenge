import { Injectable } from '@nestjs/common';
import { HealthcarePlanRepository } from './healthcare-plan.repository';
import { HealthcarePlanMapper } from './healthcare-plan.mapper';
import { HealthcarePlan } from '../../graphql/healthcare-plan/types/healthcare-plan.type';

@Injectable()
export class HealthcarePlanService {
  constructor(
    private readonly repository: HealthcarePlanRepository,
    private readonly mapper: HealthcarePlanMapper,
  ) {}

  async getAllPlans(): Promise<HealthcarePlan[]> {
    const plans = await this.repository.findAll();
    return plans.map((p) => this.mapper.toGraphQL(p));
  }
}
