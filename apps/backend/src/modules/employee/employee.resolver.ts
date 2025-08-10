import { Resolver, Query, Args } from '@nestjs/graphql';
import { Employee } from '../../graphql/types/employee.type';
import { EmployeeService } from './employee.service';

@Resolver(() => Employee)
export class EmployeeResolver {
  constructor(private readonly service: EmployeeService) {}

  @Query(() => [Employee], {
    name: 'employeesByCompany',
    description: 'Get employees by company ID',
  })
  async employeesByCompany(
    @Args('companyId', { type: () => String }) companyId: string,
  ): Promise<Employee[]> {
    return this.service.getEmployeesByCompany(companyId);
  }
}
