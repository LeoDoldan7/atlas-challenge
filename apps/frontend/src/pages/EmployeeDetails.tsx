import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { 
  Container, 
  Stack, 
  Title, 
  Text, 
  Card, 
  Group, 
  Loader, 
  ThemeIcon,
  Button
} from '@mantine/core';
import { 
  IconAlertCircle, 
  IconArrowLeft,
} from '@tabler/icons-react';
import { GET_EMPLOYEE_SUBSCRIPTIONS_QUERY, EMPLOYEES_BY_COMPANY_QUERY } from '../lib/queries';
import type { Employee, EmployeesByCompanyResponse, SubscriptionsResponse } from '../types';
import { EmployeeInformationCard } from '../components/employee/EmployeeInformationCard';
import { EmployeeSubscriptionsList } from '../components/employee/EmployeeSubscriptionsList';
import { PageBreadcrumbs } from '../components/common';

const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Get employee details (we need to get this from the employees list since we don't have individual employee query)
  const { data: employeesData, loading: employeesLoading } = useQuery<EmployeesByCompanyResponse>(EMPLOYEES_BY_COMPANY_QUERY, {
    variables: { companyId: '1' },
  });
  
  // Get employee subscriptions
  const { data: subscriptionsData, loading: subscriptionsLoading, error } = useQuery<SubscriptionsResponse>(GET_EMPLOYEE_SUBSCRIPTIONS_QUERY, {
    variables: { employeeId: id! },
    skip: !id,
  });

  const employee = employeesData?.employeesByCompany?.find((emp: Employee) => emp.id === id);
  const subscriptions = subscriptionsData?.getSubscriptions || [];
  const loading = employeesLoading || subscriptionsLoading;

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Card p="xl" radius="xl" shadow="lg" style={{ maxWidth: 600, margin: '0 auto' }}>
          <Stack align="center" gap="md">
            <Loader size="xl" />
            <Text size="xl" fw={500}>Loading employee details...</Text>
          </Stack>
        </Card>
      </Container>
    );
  }

  if (error || !employee) {
    return (
      <Container size="lg" py="xl">
        <Card p="xl" radius="xl" shadow="lg" style={{ maxWidth: 600, margin: '0 auto' }}>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="red">
              <IconAlertCircle size={32} />
            </ThemeIcon>
            <Title order={2}>Employee Not Found</Title>
            <Text ta="center" c="dimmed" maw={400}>
              The employee you're looking for doesn't exist or couldn't be loaded.
            </Text>
            <Button
              onClick={() => navigate('/employees')}
              leftSection={<IconArrowLeft size={16} />}
              radius="xl"
            >
              Back to Employees
            </Button>
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
              { label: 'Employees', href: '/employees' },
              { label: `${employee.demographic.firstName} ${employee.demographic.lastName}` },
            ]}
          />

          <Group justify="apart">
            <Stack gap="xs">
              <Title order={1} size={36} fw={700}>
                {employee.demographic.firstName} {employee.demographic.lastName}
              </Title>
              <Text size="lg" c="dimmed">
                Employee healthcare subscriptions and details
              </Text>
            </Stack>
            <Button
              onClick={() => navigate('/employees')}
              variant="outline"
              radius="xl"
              leftSection={<IconArrowLeft size={16} />}
            >
              Back to Employees
            </Button>
          </Group>
        </Stack>

        <Container size="sm" p={0}>
          <Stack gap="lg">
            <EmployeeInformationCard employee={employee} />

            <EmployeeSubscriptionsList subscriptions={subscriptions} />
          </Stack>
        </Container>
      </Stack>
    </Container>
  );
};

export default EmployeeDetails;