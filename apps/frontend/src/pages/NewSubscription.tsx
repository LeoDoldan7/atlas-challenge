import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Minus, Plus } from 'lucide-react';

import { useEmployees } from '../hooks/useEmployees';
import { useHealthcarePlans } from '../hooks/useHealthcarePlans';
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
  
  // Fetch all healthcare plans (keeping the hook but not displaying them)
  const { loading: plansLoading, error: plansError, refetch: refetchPlans } = useHealthcarePlans();

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
  const hasError = employeesError || plansError;

  const handleRetry = async () => {
    await Promise.all([refetchEmployees(), refetchPlans()]);
  };

  const onSubmit = (data: SubscriptionForm) => {
    console.log('Form submitted:', {
      ...data,
      subscriptionType,
      selectedEmployee,
    });
    // TODO: Implement actual submission logic
    alert(`Subscription created for employee ${selectedEmployee?.email} (${subscriptionType})`);
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
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-3 text-lg text-muted-foreground">Loading subscription data...</span>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium mb-2">Failed to load data</h2>
              <p className="text-muted-foreground mb-4">
                {employeesError?.message || plansError?.message || 'An error occurred while fetching data'}
              </p>
              <Button onClick={handleRetry}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Breadcrumbs */}
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/subscriptions">Subscriptions</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>New</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div>
            <h1 className="text-3xl font-bold">New Subscription</h1>
            <p className="mt-2 text-muted-foreground">
              Create a new healthcare subscription by selecting an employee and configuring coverage options.
            </p>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Employee Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Selection</CardTitle>
              <CardDescription>
                Select the employee for this subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="employee-select">Employee *</Label>
                <Select 
                  value={employeeId} 
                  onValueChange={(value) => setValue('employeeId', value, { shouldValidate: true })}
                >
                  <SelectTrigger id="employee-select" className={errors.employeeId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Search and select an employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee: Employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{employee.email}</span>
                          <span className="text-xs text-muted-foreground">
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
          <Card>
            <CardHeader>
              <CardTitle>Coverage Choices</CardTitle>
              <CardDescription>
                Configure family coverage options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Spouse Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="spouse-included"
                  checked={spouseIncluded}
                  onCheckedChange={(checked) => 
                    setValue('spouseIncluded', checked as boolean, { shouldValidate: true })
                  }
                />
                <Label htmlFor="spouse-included">Spouse included</Label>
              </div>

              {/* Children Count Stepper */}
              <div className="space-y-2">
                <Label>Number of children</Label>
                <div className="flex items-center space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustChildrenCount(-1)}
                    disabled={childrenCount <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="min-w-[3rem] text-center text-lg font-medium">
                    {childrenCount}
                  </span>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustChildrenCount(1)}
                    disabled={childrenCount >= 7}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Maximum 7 children allowed</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Type Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Preview</CardTitle>
              <CardDescription>
                Based on your coverage selections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label>Subscription type:</Label>
                  <Badge variant={subscriptionType === 'INDIVIDUAL' ? 'secondary' : 'default'}>
                    {subscriptionType.toLowerCase()}
                  </Badge>
                </div>
                
                {selectedEmployee && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Selected Employee</h4>
                    <p className="text-sm">
                      <strong>Email:</strong> {selectedEmployee.email}
                    </p>
                    <p className="text-sm">
                      <strong>Marital Status:</strong> {selectedEmployee.maritalStatus}
                    </p>
                    <p className="text-sm">
                      <strong>Birth Date:</strong> {new Date(selectedEmployee.birthDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Save Subscription
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSubscription;