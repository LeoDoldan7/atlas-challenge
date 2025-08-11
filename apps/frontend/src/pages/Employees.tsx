import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Stack, 
  Card, 
  Loader, 
  ThemeIcon,
  Title,
  Text
} from '@mantine/core';
import { 
  IconAlertCircle
} from '@tabler/icons-react';
import { useEmployees } from '../hooks/useEmployees';
import type { Employee } from '../types';
import { PageBreadcrumbs } from '../components/common';
import {
  EmployeesPageHeader,
  EmployeeStats,
  EmployeeSearchFilters,
  EmployeeGrid,
} from '../components/employees';

const Employees: React.FC = () => {
  const navigate = useNavigate();
  const { employees, loading, error } = useEmployees('1');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'overdue' | 'sufficient'>('all');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (cents: string) => {
    const dollars = parseInt(cents) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(dollars);
  };

  const getWalletStatus = (employee: Employee) => {
    if (!employee.wallet) return 'no-wallet';
    const balance = parseInt(employee.wallet.balanceCents);
    // Simplified check - in reality, you'd calculate actual subscription costs
    return balance >= 10000 ? 'sufficient' : 'overdue'; // $100 threshold
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = !searchTerm || 
      employee.demographic.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.demographic.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (paymentFilter === 'all') return true;
    if (paymentFilter === 'overdue') return getWalletStatus(employee) === 'overdue';
    if (paymentFilter === 'sufficient') return getWalletStatus(employee) === 'sufficient';
    
    return true;
  });


  const getMaritalStatusColor = (status: string) => {
    switch (status) {
      case 'MARRIED':
        return 'blue';
      case 'SINGLE':
        return 'green';
      case 'DIVORCED':
        return 'orange';
      case 'SEPARATED':
        return 'yellow';
      case 'WIDOWED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/employees/${employeeId}`);
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Card p="xl" radius="xl" shadow="lg" style={{ maxWidth: 600, margin: '0 auto' }}>
          <Stack align="center" gap="md">
            <Loader size="xl" />
            <Text size="xl" fw={500}>Loading employees...</Text>
          </Stack>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Card p="xl" radius="xl" shadow="lg" style={{ maxWidth: 600, margin: '0 auto' }}>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="red">
              <IconAlertCircle size={32} />
            </ThemeIcon>
            <Title order={2}>Error Loading Employees</Title>
            <Text ta="center" c="dimmed" maw={400}>
              {error.message || 'Failed to load employees. Please try again.'}
            </Text>
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Stack gap="md">
          <PageBreadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Employees' },
            ]}
          />
          <EmployeesPageHeader />
        </Stack>

        <EmployeeStats totalEmployees={employees.length} />

        <EmployeeSearchFilters
          searchTerm={searchTerm}
          paymentFilter={paymentFilter}
          onSearchChange={setSearchTerm}
          onPaymentFilterChange={setPaymentFilter}
        />

        <EmployeeGrid
          employees={filteredEmployees}
          onEmployeeClick={handleEmployeeClick}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          getWalletStatus={getWalletStatus}
          getMaritalStatusColor={getMaritalStatusColor}
        />
      </Stack>
    </Container>
  );
};

export default Employees;