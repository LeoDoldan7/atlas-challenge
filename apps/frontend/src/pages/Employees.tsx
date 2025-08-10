import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Anchor
} from '@mantine/core';
import { 
  IconUser, 
  IconAlertCircle, 
  IconMail, 
  IconCalendar,
  IconUsers
} from '@tabler/icons-react';
import { useEmployees } from '../hooks/useEmployees';

const Employees: React.FC = () => {
  const navigate = useNavigate();
  const { employees, loading, error } = useEmployees('1');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
        {/* Header with Breadcrumbs */}
        <Stack gap="md">
          <Breadcrumbs>
            <Anchor href="/dashboard" c="dimmed">
              Dashboard
            </Anchor>
            <Text fw={500}>Employees</Text>
          </Breadcrumbs>

          <Group justify="apart">
            <Stack gap="xs">
              <Title order={1} size={36} fw={700}>
                Employees
              </Title>
              <Text size="lg" c="dimmed">
                Manage company employees and their healthcare subscriptions
              </Text>
            </Stack>
          </Group>
        </Stack>

        {/* Stats Card */}
        <Card p="lg" radius="xl" shadow="md">
          <Group gap="lg">
            <ThemeIcon size={48} radius="xl" color="blue" variant="light">
              <IconUsers size={24} />
            </ThemeIcon>
            <Stack gap="xs">
              <Text fw={500} c="dimmed">Total Employees</Text>
              <Text size="xl" fw={700}>{employees.length}</Text>
            </Stack>
          </Group>
        </Card>

        {/* Employee Grid */}
        {employees.length === 0 ? (
          <Card p="xl" radius="xl" shadow="md">
            <Stack align="center" gap="md">
              <ThemeIcon size={64} radius="xl" color="gray" variant="light">
                <IconUser size={32} />
              </ThemeIcon>
              <Title order={3}>No Employees Found</Title>
              <Text c="dimmed" ta="center">
                There are currently no employees in the system.
              </Text>
            </Stack>
          </Card>
        ) : (
          <SimpleGrid 
            cols={{ base: 1, sm: 2, lg: 3 }} 
            spacing="lg"
          >
            {employees.map((employee) => (
              <Card
                key={employee.id}
                p="lg"
                radius="xl"
                shadow="md"
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--mantine-shadow-lg)';
                  e.currentTarget.style.borderColor = 'var(--mantine-color-blue-3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                onClick={() => handleEmployeeClick(employee.id)}
              >
                <Stack gap="md">
                  {/* Employee Header */}
                  <Group gap="md">
                    <ThemeIcon size={40} radius="xl" color="blue" variant="light">
                      <IconUser size={20} />
                    </ThemeIcon>
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text fw={600} size="lg">
                        {employee.demographic.firstName} {employee.demographic.lastName}
                      </Text>
                      <Text size="sm" c="dimmed">
                        Employee ID: {employee.id}
                      </Text>
                    </Stack>
                  </Group>

                  {/* Employee Details */}
                  <Stack gap="sm">
                    <Group gap="xs">
                      <IconMail size={16} style={{ opacity: 0.6 }} />
                      <Text size="sm">{employee.email}</Text>
                    </Group>

                    <Group gap="xs">
                      <IconCalendar size={16} style={{ opacity: 0.6 }} />
                      <Text size="sm">Born: {formatDate(employee.birthDate)}</Text>
                    </Group>

                    <Group justify="space-between" mt="xs">
                      <Badge 
                        color={getMaritalStatusColor(employee.maritalStatus)} 
                        variant="light"
                        size="sm"
                      >
                        {employee.maritalStatus.toLowerCase().replace('_', ' ')}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        Joined: {formatDate(employee.createdAt)}
                      </Text>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
};

export default Employees;