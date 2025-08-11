import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import {
  Button,
  Card,
  Checkbox,
  Select,
  Badge,
  Breadcrumbs,
  Anchor,
  Text,
  Title,
  Container,
  Stack,
  Group,
  ActionIcon,
  Loader,
  Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { useEmployees } from '../hooks/useEmployees';
import { useHealthcarePlans } from '../hooks/useHealthcarePlans';
import { useCreateSubscription } from '../hooks/useCreateSubscription';
import { CostSharingConfiguration } from '../components/cost-sharing';
import type { Employee, SubscriptionType } from '../types';

// Form validation schema
const subscriptionSchema = z.object({
  employeeId: z.string().min(1, 'Please select an employee'),
  planId: z.string().min(1, 'Please select a healthcare plan'),
  spouseIncluded: z.boolean(),
  childrenCount: z.number().min(0).max(7),
  employeeCompanyPercent: z.number().min(0).max(100),
  employeeEmployeePercent: z.number().min(0).max(100),
  spouseCompanyPercent: z.number().min(0).max(100),
  spouseEmployeePercent: z.number().min(0).max(100),
  childCompanyPercent: z.number().min(0).max(100),
  childEmployeePercent: z.number().min(0).max(100),
}).refine((data) => {
  // Validate that employee percentages sum to 100
  const employeeSum = data.employeeCompanyPercent + data.employeeEmployeePercent;
  const spouseSum = data.spouseCompanyPercent + data.spouseEmployeePercent;
  const childSum = data.childCompanyPercent + data.childEmployeePercent;
  
  return employeeSum === 100 && spouseSum === 100 && childSum === 100;
}, {
  message: "Employee and Company percentages must sum to 100% for each member type",
});

type SubscriptionForm = z.infer<typeof subscriptionSchema>;

const NewSubscription: React.FC = () => {
  const navigate = useNavigate();

  // Fetch employees for company #1
  const { employees, loading: employeesLoading, error: employeesError, refetch: refetchEmployees } = useEmployees('1');

  // Fetch all healthcare plans
  const { plans, loading: plansLoading, error: plansError, refetch: refetchPlans } = useHealthcarePlans();

  // Create subscription mutation
  const { createSubscription, loading: creatingSubscription, error: createSubscriptionError } = useCreateSubscription();

  // Form state
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<SubscriptionForm>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      employeeId: '',
      planId: '',
      spouseIncluded: false,
      childrenCount: 0,
      employeeCompanyPercent: 0,
      employeeEmployeePercent: 100,
      spouseCompanyPercent: 0,
      spouseEmployeePercent: 100,
      childCompanyPercent: 0,
      childEmployeePercent: 100,
    },
    mode: 'onChange',
  });

  // Watch form values for dynamic updates
  const employeeId = watch('employeeId');
  const planId = watch('planId');
  const spouseIncluded = watch('spouseIncluded');
  const childrenCount = watch('childrenCount');
  const employeeCompanyPercent = watch('employeeCompanyPercent');
  const employeeEmployeePercent = watch('employeeEmployeePercent');
  const spouseCompanyPercent = watch('spouseCompanyPercent');
  const spouseEmployeePercent = watch('spouseEmployeePercent');
  const childCompanyPercent = watch('childCompanyPercent');
  const childEmployeePercent = watch('childEmployeePercent');

  // Calculate subscription type dynamically
  const subscriptionType: SubscriptionType =
    !spouseIncluded && childrenCount === 0 ? 'INDIVIDUAL' : 'FAMILY';

  // Find selected employee and plan
  const selectedEmployee = employees.find(emp => emp.id === employeeId);
  const selectedPlan = plans.find(plan => plan.id === planId);

  // Loading and error states
  const isLoading = employeesLoading || plansLoading;
  const hasError = employeesError || plansError || createSubscriptionError;

  const handleRetry = async () => {
    await Promise.all([refetchEmployees(), refetchPlans()]);
  };

  const onSubmit = async (data: SubscriptionForm) => {
    if (!selectedEmployee) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: 'Please select an employee',
      });
      return;
    }

    if (!selectedPlan) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: 'Please select a healthcare plan',
      });
      return;
    }

    try {
      await createSubscription({
        employeeId: parseInt(data.employeeId),
        includeSpouse: data.spouseIncluded,
        numOfChildren: data.childrenCount,
        planId: parseInt(data.planId),
        employeePercentages: {
          companyPercent: data.employeeCompanyPercent,
          employeePercent: data.employeeEmployeePercent,
        },
        spousePercentages: {
          companyPercent: data.spouseCompanyPercent,
          employeePercent: data.spouseEmployeePercent,
        },
        childPercentages: {
          companyPercent: data.childCompanyPercent,
          employeePercent: data.childEmployeePercent,
        },
      });

      notifications.show({
        color: 'green',
        title: 'Success',
        message: `Subscription created successfully for ${selectedEmployee.demographic.firstName} ${selectedEmployee.demographic.lastName}!`,
      });
      navigate('/subscriptions');
    } catch (error) {
      console.error('Failed to create subscription:', error);
      notifications.show({
        color: 'red',
        title: 'Error',
        message: 'Failed to create subscription. Please try again.',
      });
    }
  };

  const handleCancel = () => {
    navigate('/subscriptions');
  };

  const adjustChildrenCount = (adjustment: number) => {
    const newCount = Math.max(0, Math.min(7, childrenCount + adjustment));
    setValue('childrenCount', newCount, { shouldValidate: true });
  };

  const handlePlanSelection = (planId: string | null) => {
    setValue('planId', planId || '', { shouldValidate: true });
    
    if (planId) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        // Auto-populate with plan's default percentages (convert strings to numbers)
        const employeeCompanyPercent = parseInt(plan.pctEmployeePaidByCompany);
        const spouseCompanyPercent = parseInt(plan.pctSpousePaidByCompany);
        const childCompanyPercent = parseInt(plan.pctChildPaidByCompany);
        
        setValue('employeeCompanyPercent', employeeCompanyPercent, { shouldValidate: true });
        setValue('employeeEmployeePercent', 100 - employeeCompanyPercent, { shouldValidate: true });
        setValue('spouseCompanyPercent', spouseCompanyPercent, { shouldValidate: true });
        setValue('spouseEmployeePercent', 100 - spouseCompanyPercent, { shouldValidate: true });
        setValue('childCompanyPercent', childCompanyPercent, { shouldValidate: true });
        setValue('childEmployeePercent', 100 - childCompanyPercent, { shouldValidate: true });
      }
    }
  };

  const handleCompanyPercentChange = (value: number | string, memberType: 'employee' | 'spouse' | 'child') => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const clampedValue = Math.max(0, Math.min(100, numValue));
    const employeePercent = 100 - clampedValue;
    
    if (memberType === 'employee') {
      setValue('employeeCompanyPercent', clampedValue, { shouldValidate: true });
      setValue('employeeEmployeePercent', employeePercent, { shouldValidate: true });
    } else if (memberType === 'spouse') {
      setValue('spouseCompanyPercent', clampedValue, { shouldValidate: true });
      setValue('spouseEmployeePercent', employeePercent, { shouldValidate: true });
    } else if (memberType === 'child') {
      setValue('childCompanyPercent', clampedValue, { shouldValidate: true });
      setValue('childEmployeePercent', employeePercent, { shouldValidate: true });
    }
  };

  const handleEmployeePercentChange = (value: number | string, memberType: 'employee' | 'spouse' | 'child') => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const clampedValue = Math.max(0, Math.min(100, numValue));
    const companyPercent = 100 - clampedValue;
    
    if (memberType === 'employee') {
      setValue('employeeEmployeePercent', clampedValue, { shouldValidate: true });
      setValue('employeeCompanyPercent', companyPercent, { shouldValidate: true });
    } else if (memberType === 'spouse') {
      setValue('spouseEmployeePercent', clampedValue, { shouldValidate: true });
      setValue('spouseCompanyPercent', companyPercent, { shouldValidate: true });
    } else if (memberType === 'child') {
      setValue('childEmployeePercent', clampedValue, { shouldValidate: true });
      setValue('childCompanyPercent', companyPercent, { shouldValidate: true });
    }
  };

  if (isLoading) {
    return (
      <Container size="lg" py={48}>
        <Card shadow="xl" padding="xl">
          <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
            <Loader size="xl" />
            <Text size="xl" fw={500}>Loading subscription data...</Text>
          </Stack>
        </Card>
      </Container>
    );
  }

  if (hasError) {
    return (
      <Container size="lg" py={48}>
        <Card shadow="xl" padding="xl">
          <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
            <Alert color="red" title="Failed to load data" style={{ textAlign: 'center' }}>
              <Text>
                {employeesError?.message || plansError?.message || createSubscriptionError?.message || 'An error occurred while fetching data'}
              </Text>
            </Alert>
            <Button onClick={handleRetry} size="lg">Try Again</Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  const breadcrumbItems = [
    { title: 'Subscriptions', href: '/subscriptions' },
    { title: 'New', href: '#' },
  ];

  return (
    <Container size="xl" py={32}>
      <Stack gap="xl">
        {/* Header with Breadcrumbs */}
        <Stack gap="md">
          <Breadcrumbs>
            {breadcrumbItems.map((item, index) => (
              <Anchor key={index} href={item.href} c={index === breadcrumbItems.length - 1 ? 'dimmed' : 'blue'}>
                {item.title}
              </Anchor>
            ))}
          </Breadcrumbs>

          <Stack align="center" gap="xs">
            <Title order={1}>New Subscription</Title>
            <Text c="dimmed" size="lg" ta="center">
              Create a new healthcare subscription by selecting an employee and configuring coverage options.
            </Text>
          </Stack>
        </Stack>

        {/* Main Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="xl">
            {/* Employee Selection */}
            <Card shadow="lg" padding="lg">
              <Stack gap="md">
                <Group gap="xs">
                  <div style={{ width: 8, height: 8, backgroundColor: 'var(--mantine-color-blue-6)', borderRadius: '50%' }} />
                  <Title order={3}>Employee Selection</Title>
                </Group>
                <Text c="dimmed">Select the employee for this subscription</Text>

                <Select
                  label="Employee *"
                  placeholder="Search and select an employee..."
                  data={employees.map((employee: Employee) => ({
                    value: employee.id,
                    label: `${employee.demographic.firstName} ${employee.demographic.lastName}`,
                  }))}
                  value={employeeId}
                  onChange={(value) => setValue('employeeId', value || '', { shouldValidate: true })}
                  error={errors.employeeId?.message}
                  searchable
                />
              </Stack>
            </Card>

            {/* Healthcare Plan Selection */}
            <Card shadow="lg" padding="lg">
              <Stack gap="md">
                <Group gap="xs">
                  <div style={{ width: 8, height: 8, backgroundColor: 'var(--mantine-color-green-6)', borderRadius: '50%' }} />
                  <Title order={3}>Healthcare Plan</Title>
                </Group>
                <Text c="dimmed">Select the healthcare plan for this subscription</Text>

                <Select
                  label="Healthcare Plan *"
                  placeholder="Select a healthcare plan..."
                  data={plans.map((plan) => ({
                    value: plan.id,
                    label: plan.name,
                  }))}
                  value={planId}
                  onChange={handlePlanSelection}
                  error={errors.planId?.message}
                />

              </Stack>
            </Card>

            {/* Coverage Choices */}
            <Card shadow="lg" padding="lg">
              <Stack gap="md">
                <Group gap="xs">
                  <div style={{ width: 8, height: 8, backgroundColor: 'var(--mantine-color-teal-6)', borderRadius: '50%' }} />
                  <Title order={3}>Coverage Choices</Title>
                </Group>
                <Text c="dimmed">Configure family coverage options</Text>

                <Stack gap="lg">
                  {/* Spouse Checkbox */}
                  <Card bg="gray.0" padding="md">
                    <Checkbox
                      label="Spouse included"
                      checked={spouseIncluded}
                      onChange={(event) =>
                        setValue('spouseIncluded', event.currentTarget.checked, { shouldValidate: true })
                      }
                    />
                  </Card>

                  {/* Children Count Stepper */}
                  <Card bg="gray.0" padding="md">
                    <Stack gap="md">
                      <Text fw={500}>Number of children</Text>
                      <Group justify="center">
                        <ActionIcon
                          size="xl"
                          variant="outline"
                          radius="xl"
                          onClick={() => adjustChildrenCount(-1)}
                          disabled={childrenCount <= 0}
                        >
                          <IconMinus size={20} />
                        </ActionIcon>

                        <Text size="xl" fw={700} w={60} ta="center">
                          {childrenCount}
                        </Text>

                        <ActionIcon
                          size="xl"
                          variant="outline"
                          radius="xl"
                          onClick={() => adjustChildrenCount(1)}
                          disabled={childrenCount >= 7}
                        >
                          <IconPlus size={20} />
                        </ActionIcon>
                      </Group>
                      <Text size="sm" c="dimmed" ta="center">Maximum 7 children allowed</Text>
                    </Stack>
                  </Card>
                </Stack>
              </Stack>
            </Card>

            {selectedPlan && (
              <CostSharingConfiguration
                plan={selectedPlan}
                employeeCompanyPercent={employeeCompanyPercent}
                employeeEmployeePercent={employeeEmployeePercent}
                spouseCompanyPercent={spouseCompanyPercent}
                spouseEmployeePercent={spouseEmployeePercent}
                childCompanyPercent={childCompanyPercent}
                childEmployeePercent={childEmployeePercent}
                spouseIncluded={spouseIncluded}
                childrenCount={childrenCount}
                onCompanyPercentChange={handleCompanyPercentChange}
                onEmployeePercentChange={handleEmployeePercentChange}
              />
            )}

            {/* Subscription Type Preview */}
            <Card shadow="lg" padding="lg" bg="blue.0">
              <Stack gap="md">
                <Group gap="xs">
                  <div style={{ width: 8, height: 8, backgroundColor: 'var(--mantine-color-violet-6)', borderRadius: '50%' }} />
                  <Title order={3}>Subscription Preview</Title>
                </Group>
                <Text c="dimmed">Based on your coverage selections</Text>

                <Group justify="space-between" p="md" bg="white" style={{ borderRadius: 8 }}>
                  <Text fw={500}>Subscription type:</Text>
                  <Badge 
                    variant={subscriptionType === 'INDIVIDUAL' ? 'light' : 'filled'}
                    color={subscriptionType === 'INDIVIDUAL' ? 'gray' : 'blue'}
                  >
                    {subscriptionType.toLowerCase()}
                  </Badge>
                </Group>

                {selectedEmployee && (
                  <Card bg="white" padding="lg" style={{ borderRadius: 12 }}>
                    <Stack gap="xs">
                      <Title order={4}>Selected Employee</Title>
                      <Text size="sm">
                        <Text component="span" fw={500}>Name:</Text> {selectedEmployee.demographic.firstName} {selectedEmployee.demographic.lastName}
                      </Text>
                      <Text size="sm">
                        <Text component="span" fw={500}>Email:</Text> {selectedEmployee.email}
                      </Text>
                      <Text size="sm">
                        <Text component="span" fw={500}>Marital Status:</Text> {selectedEmployee.maritalStatus}
                      </Text>
                      <Text size="sm">
                        <Text component="span" fw={500}>Birth Date:</Text> {new Date(selectedEmployee.birthDate).toLocaleDateString()}
                      </Text>
                    </Stack>
                  </Card>
                )}
              </Stack>
            </Card>

            {/* Action Buttons */}
            <Group justify="flex-end" pt="lg">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                size="lg"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!isValid || creatingSubscription}
                loading={creatingSubscription}
                size="lg"
              >
                Save Subscription
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
};

export default NewSubscription;