import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import { useEmployees } from '../hooks/useEmployees';
import { useHealthcarePlans } from '../hooks/useHealthcarePlans';
import { useCreateSubscription } from '../hooks/useCreateSubscription';
import type { Employee, SubscriptionType } from '../types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

// Form validation schema
const subscriptionSchema = z.object({
  employeeId: z.string().min(1, 'Please select an employee'),
  spouseIncluded: z.boolean(),
  childrenCount: z.number().min(0).max(7),
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
      spouseIncluded: false,
      childrenCount: 0,
    },
    mode: 'onChange',
  });

  // Watch form values for dynamic updates
  const employeeId = watch('employeeId');
  const spouseIncluded = watch('spouseIncluded');
  const childrenCount = watch('childrenCount');

  // Calculate subscription type dynamically
  const subscriptionType: SubscriptionType =
    !spouseIncluded && childrenCount === 0 ? 'INDIVIDUAL' : 'FAMILY';

  // Find selected employee
  const selectedEmployee = employees.find(emp => emp.id === employeeId);

  // Loading and error states
  const isLoading = employeesLoading || plansLoading;
  const hasError = employeesError || plansError || createSubscriptionError;

  const handleRetry = async () => {
    await Promise.all([refetchEmployees(), refetchPlans()]);
  };

  const onSubmit = async (data: SubscriptionForm) => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    // Use the first available plan for now
    const firstPlan = plans[0];
    if (!firstPlan) {
      toast.error('No healthcare plans available');
      return;
    }

    try {
      const subscription = await createSubscription({
        employeeId: parseInt(data.employeeId),
        includeSpouse: data.spouseIncluded,
        numOfChildren: data.childrenCount,
        planId: parseInt(firstPlan.id),
      });

      toast.success(`Subscription created successfully! ID: ${subscription.id}`);
      navigate('/subscriptions');
    } catch (error) {
      console.error('Failed to create subscription:', error);
      toast.error('Failed to create subscription. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/subscriptions');
  };

  const adjustChildrenCount = (adjustment: number) => {
    const newCount = Math.max(0, Math.min(7, childrenCount + adjustment));
    setValue('childrenCount', newCount, { shouldValidate: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
              <span className="text-xl font-medium text-slate-700">Loading subscription data...</span>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
            <CardContent className="text-center py-16">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-3 text-slate-900">Failed to load data</h2>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {employeesError?.message || plansError?.message || createSubscriptionError?.message || 'An error occurred while fetching data'}
              </p>
              <Button onClick={handleRetry} className="px-6 py-3 rounded-xl font-medium">Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header with Breadcrumbs */}
        <div className="space-y-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/subscriptions" className="text-slate-600 hover:text-slate-900">Subscriptions</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">New</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">New Subscription</h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Create a new healthcare subscription by selecting an employee and configuring coverage options.
            </p>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Employee Selection */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Employee Selection
              </CardTitle>
              <CardDescription className="text-base">
                Select the employee for this subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <Label htmlFor="employee-select" className="text-sm font-medium text-slate-700">Employee *</Label>
                <Select
                  value={employeeId}
                  onValueChange={(value) => setValue('employeeId', value, { shouldValidate: true })}
                >
                  <SelectTrigger id="employee-select" className={`h-12 ${errors.employeeId ? 'border-red-500' : 'border-slate-300'}`}>
                    <SelectValue placeholder="Search and select an employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee: Employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex flex-col py-1">
                          <span className="font-medium text-slate-900">{employee.email}</span>
                          <span className="text-sm text-slate-500">
                            {employee.maritalStatus} • Born: {new Date(employee.birthDate).toLocaleDateString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employeeId && (
                  <p className="text-sm text-red-600">{errors.employeeId.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Coverage Choices */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Coverage Choices
              </CardTitle>
              <CardDescription className="text-base">
                Configure family coverage options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-0">
              {/* Spouse Checkbox */}
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <Checkbox
                  id="spouse-included"
                  checked={spouseIncluded}
                  onCheckedChange={(checked) =>
                    setValue('spouseIncluded', checked as boolean, { shouldValidate: true })
                  }
                  className="w-5 h-5"
                />
                <Label htmlFor="spouse-included" className="text-base font-medium text-slate-700">Spouse included</Label>
              </div>

              {/* Children Count Stepper */}
              <div className="space-y-4 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <Label className="text-base font-medium text-slate-700">Number of children</Label>
                <div className="flex items-center justify-center space-x-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustChildrenCount(-1)}
                    disabled={childrenCount <= 0}
                    className="h-12 w-12 rounded-full border-2"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>

                  <span className="min-w-[4rem] text-center text-2xl font-bold text-slate-900">
                    {childrenCount}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustChildrenCount(1)}
                    disabled={childrenCount >= 7}
                    className="h-12 w-12 rounded-full border-2"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-sm text-slate-500 text-center">Maximum 7 children allowed</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Type Preview */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Subscription Preview
              </CardTitle>
              <CardDescription className="text-base">
                Based on your coverage selections
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/70 backdrop-blur">
                  <Label className="text-base font-medium text-slate-700">Subscription type:</Label>
                  <Badge 
                    variant={subscriptionType === 'INDIVIDUAL' ? 'secondary' : 'default'}
                    className="px-3 py-1 text-sm font-medium"
                  >
                    {subscriptionType.toLowerCase()}
                  </Badge>
                </div>

                {selectedEmployee && (
                  <div className="p-6 bg-white/70 backdrop-blur rounded-xl border border-slate-200">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">Selected Employee</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-900">Email:</span> {selectedEmployee.email}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-900">Marital Status:</span> {selectedEmployee.maritalStatus}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-900">Birth Date:</span> {new Date(selectedEmployee.birthDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center sm:justify-end space-x-6 pt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              className="px-8 py-3 text-base font-medium rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid || creatingSubscription}
              className="px-8 py-3 text-base font-medium rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
            >
              {creatingSubscription ? 'Creating...' : 'Save Subscription'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSubscription;