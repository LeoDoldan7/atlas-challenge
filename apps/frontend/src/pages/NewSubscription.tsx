import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Card,
  Text,
  Title,
  Container,
  Stack,
  Group,
  Loader,
  Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { useEmployees } from '../hooks/useEmployees';
import { useHealthcarePlans } from '../hooks/useHealthcarePlans';
import { useCreateSubscription } from '../hooks/useCreateSubscription';
import { CostSharingConfiguration } from '../components/cost-sharing';
import { CoverageChoices, EmployeeSelection, SubscriptionPreview, PlanSelection } from '../components/subscription';
import { PageBreadcrumbs } from '../components/common';
import type { SubscriptionType } from '../types';

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
    { label: 'Subscriptions', href: '/subscriptions' },
    { label: 'New' },
  ];

  return (
    <Container size="xl" py={32}>
      <Stack gap="xl">
        <Stack gap="md">
          <PageBreadcrumbs items={breadcrumbItems} />

          <Stack align="center" gap="xs">
            <Title order={1}>New Subscription</Title>
            <Text c="dimmed" size="lg" ta="center">
              Create a new healthcare subscription by selecting an employee and configuring coverage options.
            </Text>
          </Stack>
        </Stack>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="xl">
            <EmployeeSelection
              employees={employees}
              selectedEmployeeId={employeeId}
              onEmployeeChange={(employeeId) => setValue('employeeId', employeeId, { shouldValidate: true })}
              error={errors.employeeId?.message}
            />

            <PlanSelection
              plans={plans}
              selectedPlanId={planId}
              onPlanChange={handlePlanSelection}
              error={errors.planId?.message}
            />

            <CoverageChoices
              spouseIncluded={spouseIncluded}
              childrenCount={childrenCount}
              onSpouseChange={(checked) => setValue('spouseIncluded', checked, { shouldValidate: true })}
              onChildrenCountChange={(count) => setValue('childrenCount', count, { shouldValidate: true })}
            />

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

            <SubscriptionPreview
              subscriptionType={subscriptionType}
              selectedEmployee={selectedEmployee}
            />

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