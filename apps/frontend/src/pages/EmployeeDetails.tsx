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
  Badge, 
  Loader, 
  ThemeIcon,
  SimpleGrid,
  Breadcrumbs,
  Anchor,
  Button,
  Divider
} from '@mantine/core';
import { 
  IconUser, 
  IconAlertCircle, 
  IconMail, 
  IconCalendar,
  IconFileText,
  IconArrowLeft,
  IconEye,
  IconUsers,
  IconCheck,
  IconClock,
  IconX
} from '@tabler/icons-react';
import { GET_EMPLOYEE_SUBSCRIPTIONS_QUERY, EMPLOYEES_BY_COMPANY_QUERY } from '../lib/queries';
import type { Employee, HealthcareSubscription, EmployeesByCompanyResponse, SubscriptionsResponse } from '../types';

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'CANCELED':
        return 'red';
      case 'DEMOGRAPHIC_VERIFICATION_PENDING':
        return 'blue';
      case 'DOCUMENT_UPLOAD_PENDING':
        return 'violet';
      case 'PLAN_ACTIVATION_PENDING':
        return 'orange';
      default:
        return 'yellow';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return IconCheck;
      case 'CANCELED':
      case 'DEMOGRAPHIC_VERIFICATION_PENDING':
      case 'DOCUMENT_UPLOAD_PENDING':
      case 'PLAN_ACTIVATION_PENDING':
        return IconClock;
      default:
        return IconAlertCircle;
    }
  };

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
        {/* Header with Breadcrumbs */}
        <Stack gap="md">
          <Breadcrumbs>
            <Anchor href="/employees" c="dimmed">
              Employees
            </Anchor>
            <Text fw={500}>
              {employee.demographic.firstName} {employee.demographic.lastName}
            </Text>
          </Breadcrumbs>

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
            {/* Employee Information Card */}
            <Card p="lg" radius="xl" shadow="md">
              <Stack gap="md">
                <Group gap="md">
                  <ThemeIcon size={48} radius="xl" color="blue" variant="light">
                    <IconUser size={24} />
                  </ThemeIcon>
                  <Stack gap="xs">
                    <Title order={3} fw={600}>Employee Information</Title>
                    <Text c="dimmed">Personal details and contact information</Text>
                  </Stack>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <Stack gap="sm">
                    <div>
                      <Text size="sm" fw={500} c="dimmed" mb={4}>Full Name</Text>
                      <Text size="lg">{employee.demographic.firstName} {employee.demographic.lastName}</Text>
                    </div>
                    
                    <div>
                      <Text size="sm" fw={500} c="dimmed" mb={4}>Employee ID</Text>
                      <Text size="lg">{employee.id}</Text>
                    </div>

                    <div>
                      <Text size="sm" fw={500} c="dimmed" mb={4}>Email</Text>
                      <Group gap="xs">
                        <IconMail size={16} style={{ opacity: 0.6 }} />
                        <Text size="lg">{employee.email}</Text>
                      </Group>
                    </div>
                  </Stack>

                  <Stack gap="sm">
                    <div>
                      <Text size="sm" fw={500} c="dimmed" mb={4}>Birth Date</Text>
                      <Group gap="xs">
                        <IconCalendar size={16} style={{ opacity: 0.6 }} />
                        <Text size="lg">{formatDate(employee.birthDate)}</Text>
                      </Group>
                    </div>

                    <div>
                      <Text size="sm" fw={500} c="dimmed" mb={4}>Marital Status</Text>
                      <Badge 
                        color={getMaritalStatusColor(employee.maritalStatus)} 
                        variant="light"
                        size="lg"
                      >
                        {employee.maritalStatus.toLowerCase().replace('_', ' ')}
                      </Badge>
                    </div>

                    <div>
                      <Text size="sm" fw={500} c="dimmed" mb={4}>Join Date</Text>
                      <Text size="lg">{formatDate(employee.createdAt)}</Text>
                    </div>
                  </Stack>
                </SimpleGrid>
              </Stack>
            </Card>

            {/* Subscriptions Overview Card */}
            <Card p="lg" radius="xl" shadow="md">
              <Stack gap="md">
                <Group justify="apart" align="flex-start">
                  <Group gap="md">
                    <ThemeIcon size={48} radius="xl" color="green" variant="light">
                      <IconFileText size={24} />
                    </ThemeIcon>
                    <Stack gap="xs">
                      <Title order={3} fw={600}>Healthcare Subscriptions</Title>
                      <Text c="dimmed">Employee's healthcare subscription history</Text>
                    </Stack>
                  </Group>
                  <Badge color="blue" variant="light" size="lg">
                    {subscriptions.length} {subscriptions.length === 1 ? 'subscription' : 'subscriptions'}
                  </Badge>
                </Group>

                <Divider />

                {subscriptions.length === 0 ? (
                  <Stack align="center" gap="md" py="xl">
                    <ThemeIcon size={64} radius="xl" color="gray" variant="light">
                      <IconFileText size={32} />
                    </ThemeIcon>
                    <Title order={4}>No Subscriptions Found</Title>
                    <Text c="dimmed" ta="center" maw={400}>
                      This employee doesn't have any healthcare subscriptions yet.
                    </Text>
                  </Stack>
                ) : (
                  <Stack gap="md">
                    {subscriptions.map((subscription: HealthcareSubscription) => {
                      const StatusIcon = getStatusIcon(subscription.status);
                      return (
                        <Card 
                          key={subscription.id} 
                          p="md" 
                          radius="lg" 
                          style={{ 
                            border: '1px solid var(--mantine-color-gray-3)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--mantine-color-blue-4)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--mantine-color-gray-3)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          onClick={() => navigate(`/subscriptions/${subscription.id}`)}
                        >
                          <Group justify="apart" align="flex-start">
                            <Stack gap="sm" style={{ flex: 1 }}>
                              <Group gap="md">
                                <ThemeIcon 
                                  size={32} 
                                  radius="md" 
                                  color={getStatusColor(subscription.status)} 
                                  variant="light"
                                >
                                  <StatusIcon size={16} />
                                </ThemeIcon>
                                <Stack gap={4}>
                                  <Group gap="xs">
                                    <Text fw={600}>
                                      {subscription.type === 'INDIVIDUAL' ? 'Individual' : 'Family'} Plan
                                    </Text>
                                    <Badge 
                                      color={getStatusColor(subscription.status)} 
                                      variant="light" 
                                      size="sm"
                                    >
                                      {subscription.status.toLowerCase().replace(/_/g, ' ')}
                                    </Badge>
                                  </Group>
                                  <Text size="sm" c="dimmed">
                                    {subscription.plan?.name || 'Plan details not available'}
                                  </Text>
                                </Stack>
                              </Group>

                              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                                <div>
                                  <Text size="xs" fw={500} c="dimmed" mb={2}>Start Date</Text>
                                  <Text size="sm">{formatDate(subscription.startDate)}</Text>
                                </div>
                                {subscription.endDate && (
                                  <div>
                                    <Text size="xs" fw={500} c="dimmed" mb={2}>End Date</Text>
                                    <Text size="sm" c="red">{formatDate(subscription.endDate)}</Text>
                                  </div>
                                )}
                                <div>
                                  <Text size="xs" fw={500} c="dimmed" mb={2}>Family Members</Text>
                                  <Group gap="xs">
                                    <IconUsers size={14} />
                                    <Text size="sm">{subscription.items?.length || 0}</Text>
                                  </Group>
                                </div>
                              </SimpleGrid>
                            </Stack>

                            <Button
                              variant="subtle"
                              size="sm"
                              rightSection={<IconEye size={16} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/subscriptions/${subscription.id}`);
                              }}
                            >
                              View Details
                            </Button>
                          </Group>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Stack>
            </Card>
          </Stack>
        </Container>
      </Stack>
    </Container>
  );
};

export default EmployeeDetails;