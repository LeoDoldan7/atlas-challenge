import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  FileText,
  User,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useSubscriptions } from '../hooks/useSubscriptions';

// Form validation schema for demographic data
const demographicSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  governmentId: z.string().min(1, 'Government ID is required'),
  birthDate: z.string().min(1, 'Birth date is required'),
});

const demographicFormSchema = z.object({
  spouse: demographicSchema.optional(),
  children: z.array(demographicSchema),
});

type DemographicForm = z.infer<typeof demographicFormSchema>;

const SubscriptionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subscriptions, loading, error } = useSubscriptions();

  const subscription = subscriptions.find(sub => sub.id === id);
  const [isSubmittingDemographics, setIsSubmittingDemographics] = useState(false);


  console.log('### subscription', subscription)
  // Get the number of spouse and children from subscription items
  const getSubscriptionItemCounts = () => {
    if (!subscription?.items) return { spouseCount: 0, childrenCount: 0 };

    const spouseCount = subscription.items.filter(item => item.role === 'SPOUSE').length;
    const childrenCount = subscription.items.filter(item => item.role === 'CHILD').length;

    return { spouseCount, childrenCount };
  };

  const { spouseCount, childrenCount } = getSubscriptionItemCounts();

  // Initialize form with default values based on actual subscription items
  const getDefaultFormValues = (): DemographicForm => {
    return {
      spouse: spouseCount > 0 ? { firstName: '', lastName: '', governmentId: '', birthDate: '' } : undefined,
      children: Array.from({ length: childrenCount }, () => ({ firstName: '', lastName: '', governmentId: '', birthDate: '' })),
    };
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DemographicForm>({
    resolver: zodResolver(demographicFormSchema),
    defaultValues: getDefaultFormValues(),
  });


  // Handle form submission
  const onSubmitDemographics = async (data: DemographicForm) => {
    setIsSubmittingDemographics(true);
    try {
      console.log('Submitting demographic data:', data);
      // TODO: Implement API call to save demographic data
      toast.success('Demographic data saved successfully!');
      // Reset form after successful submission
      reset(getDefaultFormValues());
    } catch (error) {
      console.error('Error saving demographic data:', error);
      toast.error('Failed to save demographic data. Please try again.');
    } finally {
      setIsSubmittingDemographics(false);
    }
  };

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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'TERMINATED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
              <span className="text-xl font-medium text-slate-700">Loading subscription details...</span>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
            <CardContent className="text-center py-16">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <FileText className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold mb-3 text-slate-900">Subscription Not Found</h2>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                The subscription you're looking for doesn't exist or couldn't be loaded.
              </p>
              <Button
                onClick={() => navigate('/subscriptions')}
                className="px-6 py-3 rounded-xl font-medium"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Subscriptions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with Breadcrumbs */}
        <div className="space-y-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/subscriptions" className="text-slate-600 hover:text-slate-900">
                  Subscriptions
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">Details</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Subscription Details
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                {subscription.type === 'INDIVIDUAL' ? 'Individual' : 'Family'} healthcare subscription
              </p>
            </div>
            <Button
              onClick={() => navigate('/subscriptions')}
              variant="outline"
              className="px-6 py-3 rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Overview Card */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Overview</CardTitle>
                <Badge className={`${getStatusColor(subscription.status)} border`}>
                  {subscription.status.toLowerCase().replace(/_/g, ' ')}
                </Badge>
              </div>
              <CardDescription>
                Subscription ID: {subscription.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Start Date</p>
                  <p className="text-lg text-slate-900">{formatDate(subscription.startDate)}</p>
                </div>

                {subscription.endDate && (
                  <div>
                    <p className="text-sm font-medium text-slate-700">End Date</p>
                    <p className="text-lg text-red-600">{formatDate(subscription.endDate)}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-slate-700">Billing Anchor</p>
                  <p className="text-lg text-slate-900">{subscription.billingAnchor} of each month</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700">Type</p>
                  <p className="text-lg text-slate-900 capitalize">{subscription.type.toLowerCase()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demographic Data Entry - Only show if status is DEMOGRAPHIC_VERIFICATION_PENDING */}
          {subscription.status === 'DEMOGRAPHIC_VERIFICATION_PENDING' && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Demographic Verification
                </CardTitle>
                <CardDescription>
                  Please provide demographic information for family members covered under this subscription.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmitDemographics)} className="space-y-8">
                  {/* Spouse Section - Only show if subscription has spouse */}
                  {spouseCount > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500" />
                        <h3 className="text-lg font-semibold text-slate-900">Spouse Information</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="spouse.firstName">First Name *</Label>
                          <Input
                            id="spouse.firstName"
                            {...register('spouse.firstName')}
                            placeholder="Enter first name"
                            className={errors.spouse?.firstName ? 'border-red-500' : ''}
                          />
                          {errors.spouse?.firstName && (
                            <p className="text-sm text-red-600">{errors.spouse.firstName.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="spouse.lastName">Last Name *</Label>
                          <Input
                            id="spouse.lastName"
                            {...register('spouse.lastName')}
                            placeholder="Enter last name"
                            className={errors.spouse?.lastName ? 'border-red-500' : ''}
                          />
                          {errors.spouse?.lastName && (
                            <p className="text-sm text-red-600">{errors.spouse.lastName.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="spouse.governmentId">Government ID *</Label>
                          <Input
                            id="spouse.governmentId"
                            {...register('spouse.governmentId')}
                            placeholder="e.g., SSN-123456789"
                            className={errors.spouse?.governmentId ? 'border-red-500' : ''}
                          />
                          {errors.spouse?.governmentId && (
                            <p className="text-sm text-red-600">{errors.spouse.governmentId.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="spouse.birthDate">Birth Date *</Label>
                          <Input
                            id="spouse.birthDate"
                            type="date"
                            {...register('spouse.birthDate')}
                            className={errors.spouse?.birthDate ? 'border-red-500' : ''}
                          />
                          {errors.spouse?.birthDate && (
                            <p className="text-sm text-red-600">{errors.spouse.birthDate.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Children Section - Only show if subscription has children */}
                  {childrenCount > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-500" />
                        <h3 className="text-lg font-semibold text-slate-900">
                          Children Information ({childrenCount} {childrenCount === 1 ? 'child' : 'children'})
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {Array.from({ length: childrenCount }, (_, index) => (
                          <div key={index} className="space-y-4 p-4 bg-slate-50 rounded-lg">
                            <h4 className="font-medium text-slate-900">Child #{index + 1}</h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`children.${index}.firstName`}>First Name *</Label>
                                <Input
                                  id={`children.${index}.firstName`}
                                  {...register(`children.${index}.firstName`)}
                                  placeholder="Enter first name"
                                  className={errors.children?.[index]?.firstName ? 'border-red-500' : ''}
                                />
                                {errors.children?.[index]?.firstName && (
                                  <p className="text-sm text-red-600">{errors.children[index]?.firstName?.message}</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`children.${index}.lastName`}>Last Name *</Label>
                                <Input
                                  id={`children.${index}.lastName`}
                                  {...register(`children.${index}.lastName`)}
                                  placeholder="Enter last name"
                                  className={errors.children?.[index]?.lastName ? 'border-red-500' : ''}
                                />
                                {errors.children?.[index]?.lastName && (
                                  <p className="text-sm text-red-600">{errors.children[index]?.lastName?.message}</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`children.${index}.governmentId`}>Government ID *</Label>
                                <Input
                                  id={`children.${index}.governmentId`}
                                  {...register(`children.${index}.governmentId`)}
                                  placeholder="e.g., SSN-123456789"
                                  className={errors.children?.[index]?.governmentId ? 'border-red-500' : ''}
                                />
                                {errors.children?.[index]?.governmentId && (
                                  <p className="text-sm text-red-600">{errors.children[index]?.governmentId?.message}</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`children.${index}.birthDate`}>Birth Date *</Label>
                                <Input
                                  id={`children.${index}.birthDate`}
                                  type="date"
                                  {...register(`children.${index}.birthDate`)}
                                  className={errors.children?.[index]?.birthDate ? 'border-red-500' : ''}
                                />
                                {errors.children?.[index]?.birthDate && (
                                  <p className="text-sm text-red-600">{errors.children[index]?.birthDate?.message}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-6">
                    <Button
                      type="submit"
                      disabled={isSubmittingDemographics}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmittingDemographics ? 'Saving...' : 'Save Demographic Information'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetails;