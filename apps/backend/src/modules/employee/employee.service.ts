import { Injectable } from '@nestjs/common';
import { EmployeeRepository } from './employee.repository';
import { EmployeeMapper } from './employee.mapper';
import { Employee } from '../../graphql/types/employee.type';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly repository: EmployeeRepository,
    private readonly mapper: EmployeeMapper,
  ) {}

  async getEmployeesByCompany(companyId: string): Promise<Employee[]> {
    const employees = await this.repository.findByCompanyId(companyId);
    return employees.map((e) => this.mapper.toGraphQL(e));
  }
}
