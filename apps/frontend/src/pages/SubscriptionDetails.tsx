import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client';
import {
  ArrowLeft,
  FileText,
  User,
  Users,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { UPLOAD_FAMILY_DEMOGRAPHICS_MUTATION } from '../lib/queries';

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
  const { subscriptions, loading, error, refetch } = useSubscriptions();

  const subscription = subscriptions.find(sub => sub.id === id);
  const [isSubmittingDemographics, setIsSubmittingDemographics] = useState(false);

  const [uploadFamilyDemographics] = useMutation(UPLOAD_FAMILY_DEMOGRAPHICS_MUTATION);


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
    if (!subscription?.id) return;

    setIsSubmittingDemographics(true);
    try {
      console.log('Submitting demographic data:', data);

      // Transform form data to match GraphQL input
      const familyMembers = [];

      // Add spouse if provided
      if (data.spouse && spouseCount > 0) {
        familyMembers.push({
          role: 'SPOUSE',
          demographic: {
            firstName: data.spouse.firstName,
            lastName: data.spouse.lastName,
            governmentId: data.spouse.governmentId,
            birthDate: new Date(data.spouse.birthDate).toISOString(),
          },
        });
      }

      // Add children if provided
      if (data.children && data.children.length > 0) {
        data.children.forEach(child => {
          familyMembers.push({
            role: 'CHILD',
            demographic: {
              firstName: child.firstName,
              lastName: child.lastName,
              governmentId: child.governmentId,
              birthDate: new Date(child.birthDate).toISOString(),
            },
          });
        });
      }

      // Call the mutation
      await uploadFamilyDemographics({
        variables: {
          uploadFamilyDemographicsInput: {
            subscriptionId: subscription.id,
            familyMembers,
          },
        },
      });

      toast.success('Demographic data saved successfully! Subscription status updated.');
      
      // Refetch subscriptions to get updated data
      await refetch();
      
      // Reset form after successful submission
      reset(getDefaultFormValues());
    } catch (error: unknown) {
      console.error('Error saving demographic data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save demographic data. Please try again.';
      toast.error(errorMessage);
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
      case 'DEMOGRAPHIC_VERIFICATION_PENDING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DOCUMENT_UPLOAD_PENDING':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PLAN_ACTIVATION_PENDING':
        return 'bg-orange-100 text-orange-800 border-orange-200';
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

          {/* Document Upload Section - Only show if status is DOCUMENT_UPLOAD_PENDING */}
          {subscription.status === 'DOCUMENT_UPLOAD_PENDING' && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Document Upload
                </CardTitle>
                <CardDescription>
                  Please upload the required documents to proceed with your subscription.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-lg">
                    <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Required Documents</h3>
                    <p className="text-slate-600 mb-4">
                      Accepted formats: PDF, JPG, PNG, Word documents (max 10MB each)
                    </p>
                    <Button className="px-6 py-2">
                      Choose Files
                    </Button>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Required Documents:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Government-issued ID for all family members</li>
                      <li>• Proof of employment</li>
                      <li>• Previous insurance documentation (if applicable)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan Activation Pending - Only show if status is PLAN_ACTIVATION_PENDING */}
          {subscription.status === 'PLAN_ACTIVATION_PENDING' && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Plan Activation Pending
                </CardTitle>
                <CardDescription>
                  Your documents have been received and are being reviewed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <div className="flex items-start gap-4">
                      <Clock className="h-6 w-6 text-orange-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-orange-900 mb-2">Under Review</h3>
                        <p className="text-orange-800 mb-4">
                          Our team is reviewing your submitted documents and demographic information. 
                          This process typically takes 2-3 business days.
                        </p>
                        <p className="text-sm text-orange-700">
                          You will receive an email notification once your plan is activated.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {subscription.files && subscription.files.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">Submitted Documents:</h4>
                      <div className="space-y-2">
                        {subscription.files.map((file) => (
                          <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <FileText className="h-5 w-5 text-slate-500" />
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{file.originalName}</p>
                              <p className="text-sm text-slate-500">
                                {(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB • {file.mimeType}
                              </p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Status - Only show if status is ACTIVE */}
          {subscription.status === 'ACTIVE' && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Active Subscription
                </CardTitle>
                <CardDescription>
                  Your healthcare subscription is now active and ready to use.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-start gap-4">
                      <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-green-900 mb-2">Subscription Active</h3>
                        <p className="text-green-800 mb-4">
                          Congratulations! Your healthcare subscription is now active. You can start using your benefits immediately.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="bg-white p-4 rounded-lg border border-green-200">
                            <h4 className="font-medium text-slate-900 mb-2">Coverage Starts</h4>
                            <p className="text-slate-600">{formatDate(subscription.startDate)}</p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-green-200">
                            <h4 className="font-medium text-slate-900 mb-2">Monthly Billing</h4>
                            <p className="text-slate-600">{subscription.billingAnchor} of each month</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Covered Members:</h4>
                    <div className="space-y-2">
                      {subscription.items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <User className="h-5 w-5 text-slate-500" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 capitalize">{item.role.toLowerCase()}</p>
                            {item.demographicId && (
                              <p className="text-sm text-slate-500">Verified</p>
                            )}
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Canceled/Terminated Status - Only show if status is CANCELED or TERMINATED */}
          {(subscription.status === 'CANCELED' || subscription.status === 'TERMINATED') && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  {subscription.status === 'CANCELED' ? 'Subscription Canceled' : 'Subscription Terminated'}
                </CardTitle>
                <CardDescription>
                  This subscription is no longer active.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-red-50 p-6 rounded-lg">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="h-6 w-6 text-red-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-red-900 mb-2">
                          {subscription.status === 'CANCELED' ? 'Canceled' : 'Terminated'}
                        </h3>
                        <p className="text-red-800 mb-4">
                          {subscription.status === 'CANCELED' 
                            ? 'This subscription has been canceled and is no longer providing coverage.'
                            : 'This subscription has been terminated and is no longer providing coverage.'
                          }
                        </p>
                        {subscription.endDate && (
                          <div className="bg-white p-4 rounded-lg border border-red-200 mt-4">
                            <h4 className="font-medium text-slate-900 mb-2">Coverage Ended</h4>
                            <p className="text-slate-600">{formatDate(subscription.endDate)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetails;