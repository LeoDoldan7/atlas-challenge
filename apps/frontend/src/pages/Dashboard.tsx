import React from "react";
import { useQuery } from "@apollo/client";
import { COMPANY_SPENDING_STATISTICS_QUERY } from "../lib/queries";
import {
  Card,
  Container,
  Stack,
  Group,
  Text,
  Title,
  Loader,
  Alert,
  SimpleGrid,
  ThemeIcon
} from "@mantine/core";
import { IconCurrencyDollar, IconUsers, IconBuilding, IconChartPie, IconTrendingUp } from "@tabler/icons-react";

interface CompanySpendingStatistics {
  companyId: string;
  companyName: string;
  totalMonthlyCostCents: number;
  companyMonthlyCostCents: number;
  employeeMonthlyCostCents: number;
  employeeBreakdown: EmployeeSpendingStatistics[];
  planBreakdown: PlanSpendingStatistics[];
}

interface EmployeeSpendingStatistics {
  employeeId: string;
  employeeName: string;
  totalMonthlyCostCents: number;
  companyMonthlyCostCents: number;
  employeeMonthlyCostCents: number;
}

interface PlanSpendingStatistics {
  planId: string;
  planName: string;
  subscriptionCount: number;
  totalMonthlyCostCents: number;
  companyMonthlyCostCents: number;
  employeeMonthlyCostCents: number;
}

const Dashboard: React.FC = () => {
  const { data, loading, error } = useQuery<{ getCompanySpendingStatistics: CompanySpendingStatistics }>(
    COMPANY_SPENDING_STATISTICS_QUERY,
    {
      variables: { companyId: "1" },
    }
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const statistics = data?.getCompanySpendingStatistics;

  return (
    <Container size="xl" py={48}>
      {/* Hero Section */}
      <Stack align="center" mb={48}>
        <Title order={1} size={48} ta="center" fw={900}>
          Company Dashboard
        </Title>
        <Text size="xl" c="dimmed" ta="center" maw={600}>
          View comprehensive spending statistics and analytics for your healthcare benefits.
        </Text>
      </Stack>

      {/* Main Content */}
      {loading ? (
        <Card shadow="xl" padding="xl">
          <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
            <Loader size="xl" />
            <Text size="xl" fw={500}>Loading dashboard...</Text>
          </Stack>
        </Card>
      ) : error ? (
        <Card shadow="xl" padding="xl">
          <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
            <Alert color="red" title="Failed to load dashboard" style={{ textAlign: 'center' }}>
              <Text>
                {error.message || 'An error occurred while fetching company statistics'}
              </Text>
            </Alert>
          </Stack>
        </Card>
      ) : statistics ? (
        <Stack gap="xl">
          {/* Company Overview */}
          <Card shadow="xl" padding="xl">
            <Group gap="md">
              <ThemeIcon size="xl" variant="light" color="blue">
                <IconBuilding size={32} />
              </ThemeIcon>
              <Stack gap="xs">
                <Title order={2}>{statistics.companyName}</Title>
                <Text c="dimmed">Company ID: {statistics.companyId}</Text>
              </Stack>
            </Group>
          </Card>

          {/* Cost Overview Cards */}
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            <Card shadow="lg" padding="lg">
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>Total Monthly Cost</Text>
                <ThemeIcon size="sm" variant="light">
                  <IconCurrencyDollar size={16} />
                </ThemeIcon>
              </Group>
              <Text size="xl" fw={700}>{formatCurrency(statistics.totalMonthlyCostCents)}</Text>
              <Text size="xs" c="dimmed">Total healthcare spending</Text>
            </Card>

            <Card shadow="lg" padding="lg">
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>Company Contribution</Text>
                <ThemeIcon size="sm" variant="light" color="green">
                  <IconTrendingUp size={16} />
                </ThemeIcon>
              </Group>
              <Text size="xl" fw={700} c="green">{formatCurrency(statistics.companyMonthlyCostCents)}</Text>
              <Text size="xs" c="dimmed">Company pays monthly</Text>
            </Card>

            <Card shadow="lg" padding="lg">
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>Employee Contribution</Text>
                <ThemeIcon size="sm" variant="light" color="blue">
                  <IconUsers size={16} />
                </ThemeIcon>
              </Group>
              <Text size="xl" fw={700} c="blue">{formatCurrency(statistics.employeeMonthlyCostCents)}</Text>
              <Text size="xs" c="dimmed">Employees pay monthly</Text>
            </Card>
          </SimpleGrid>

          {/* Employee Breakdown */}
          <Card shadow="xl" padding="xl">
            <Group gap="md" mb="xl">
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconUsers size={24} />
              </ThemeIcon>
              <Title order={3}>Employee Breakdown</Title>
            </Group>
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
              {statistics.employeeBreakdown.map((employee) => (
                <Card key={employee.employeeId} shadow="sm" padding="md" bg="gray.0">
                  <Stack gap="xs">
                    <Text fw={500} size="sm">{employee.employeeName}</Text>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Total:</Text>
                      <Text size="sm" fw={500}>{formatCurrency(employee.totalMonthlyCostCents)}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Company:</Text>
                      <Text size="sm" fw={500} c="green">{formatCurrency(employee.companyMonthlyCostCents)}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Employee:</Text>
                      <Text size="sm" fw={500} c="blue">{formatCurrency(employee.employeeMonthlyCostCents)}</Text>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Card>

          {/* Plan Breakdown */}
          <Card shadow="xl" padding="xl">
            <Group gap="md" mb="xl">
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconChartPie size={24} />
              </ThemeIcon>
              <Title order={3}>Plan Breakdown</Title>
            </Group>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              {statistics.planBreakdown.map((plan) => (
                <Card key={plan.planId} shadow="sm" padding="lg" bg="gray.0">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <Title order={4}>{plan.planName}</Title>
                      <Text size="sm" c="dimmed">{plan.subscriptionCount} subscriptions</Text>
                    </Group>
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text c="dimmed">Total Monthly:</Text>
                        <Text fw={500}>{formatCurrency(plan.totalMonthlyCostCents)}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text c="dimmed">Company Pays:</Text>
                        <Text fw={500} c="green">{formatCurrency(plan.companyMonthlyCostCents)}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text c="dimmed">Employee Pays:</Text>
                        <Text fw={500} c="blue">{formatCurrency(plan.employeeMonthlyCostCents)}</Text>
                      </Group>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Card>
        </Stack>
      ) : null}
    </Container>
  );
};

export default Dashboard;