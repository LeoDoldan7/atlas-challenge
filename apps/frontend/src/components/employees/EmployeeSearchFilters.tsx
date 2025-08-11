import React from 'react';
import { Card, Group, TextInput, Select } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

interface EmployeeSearchFiltersProps {
  searchTerm: string;
  paymentFilter: 'all' | 'overdue' | 'sufficient';
  onSearchChange: (value: string) => void;
  onPaymentFilterChange: (value: 'all' | 'overdue' | 'sufficient') => void;
}

export const EmployeeSearchFilters: React.FC<EmployeeSearchFiltersProps> = ({
  searchTerm,
  paymentFilter,
  onSearchChange,
  onPaymentFilterChange,
}) => {
  return (
    <Card p="lg" radius="xl" shadow="md">
      <Group gap="lg">
        <TextInput
          placeholder="Search employees by name or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1 }}
          radius="md"
        />
        <Select
          placeholder="Filter by payment status"
          value={paymentFilter}
          onChange={(value) => onPaymentFilterChange(value as 'all' | 'overdue' | 'sufficient')}
          data={[
            { value: 'all', label: 'All Employees' },
            { value: 'sufficient', label: 'Sufficient Funds' },
            { value: 'overdue', label: 'Insufficient Funds' },
          ]}
          radius="md"
          style={{ minWidth: 200 }}
        />
      </Group>
    </Card>
  );
};