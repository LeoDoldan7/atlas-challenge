import { Resolver, Query, Args } from '@nestjs/graphql';
import { CompanySpendingService } from '../../services/company-spending.service';
import { CompanySpendingStatistics } from '../types/company-spending-statistics.type';

@Resolver()
export class CompanySpendingResolver {
  constructor(private companySpendingService: CompanySpendingService) {}

  @Query(() => CompanySpendingStatistics)
  async getCompanySpendingStatistics(
    @Args('companyId') companyId: string,
  ): Promise<CompanySpendingStatistics> {
    return this.companySpendingService.getCompanySpendingStatistics(companyId);
  }
}
