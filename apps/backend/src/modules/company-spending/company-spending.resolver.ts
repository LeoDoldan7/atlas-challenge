import { Resolver, Query, Args } from '@nestjs/graphql';
import { CompanySpendingService } from './company-spending.service';
import { CompanySpendingStatistics } from '../../graphql/company/types/company-spending-statistics.type';

@Resolver()
export class CompanySpendingResolver {
  constructor(private readonly service: CompanySpendingService) {}

  @Query(() => CompanySpendingStatistics)
  async getCompanySpendingStatistics(
    @Args('companyId') companyId: string,
  ): Promise<CompanySpendingStatistics> {
    return this.service.getCompanySpendingStatistics(companyId);
  }
}
