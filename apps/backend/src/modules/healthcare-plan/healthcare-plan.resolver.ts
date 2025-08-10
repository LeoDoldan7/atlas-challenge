import { Resolver, Query } from '@nestjs/graphql';
import { HealthcarePlan } from '../../graphql/healthcare-plan/types/healthcare-plan.type';
import { HealthcarePlanService } from './healthcare-plan.service';

@Resolver(() => HealthcarePlan)
export class HealthcarePlanResolver {
  constructor(private readonly service: HealthcarePlanService) {}

  @Query(() => [HealthcarePlan], {
    name: 'healthcarePlans',
    description: 'Get all healthcare plans without relations',
  })
  async healthcarePlans(): Promise<HealthcarePlan[]> {
    return this.service.getAllPlans();
  }
}
