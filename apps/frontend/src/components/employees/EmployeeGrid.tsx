import React from 'react';
import { SimpleGrid } from '@mantine/core';
import { EmployeeCard } from './EmployeeCard';
import { EmptyEmployeesState } from './EmptyEmployeesState';
import type { Employee } from '../../types';

interface EmployeeGridProps {
  employees: Employee[];
  onEmployeeClick: (employeeId: string) => void;
  formatDate: (dateString: string) => string;
  formatCurrency: (cents: string) => string;
  getWalletStatus: (employee: Employee) => string;
  getMaritalStatusColor: (status: string) => string;
}

export const EmployeeGrid: React.FC<EmployeeGridProps> = ({
  employees,
  onEmployeeClick,
  formatDate,
  formatCurrency,
  getWalletStatus,
  getMaritalStatusColor,
}) => {
  if (employees.length === 0) {
    return <EmptyEmployeesState />;
  }

  return (
    <SimpleGrid 
      cols={{ base: 1, sm: 2, lg: 3 }} 
      spacing="lg"
    >
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          onEmployeeClick={onEmployeeClick}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          getWalletStatus={getWalletStatus}
          getMaritalStatusColor={getMaritalStatusColor}
        />
      ))}
    </SimpleGrid>
  );
};