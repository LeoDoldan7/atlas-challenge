import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@apollo/client';
import {
  IconArrowLeft,
  IconFileText,
  IconUser,
  IconUsers,
  IconUpload,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import {
  Button,
  Card,
  Stack,
  Group,
  Text,
  Title,
  Container,
  Badge,
  Loader,
  TextInput,
  Breadcrumbs,
  Anchor,
  Alert,
  ThemeIcon,
  SimpleGrid,
} from '@mantine/core';
import { GET_SUBSCRIPTION_STATUS_QUERY, UPLOAD_FAMILY_DEMOGRAPHICS_MUTATION, UPLOAD_FILES_MUTATION, ACTIVATE_PLAN_MUTATION } from '../lib/queries';
import type { HealthcareSubscription, HealthcareSubscriptionItem, HealthcareSubscriptionFile } from '../types';

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
  
  const { data, loading, error, refetch } = useQuery<{ getSubscriptionStatus: HealthcareSubscription }>(GET_SUBSCRIPTION_STATUS_QUERY, {
    variables: { subscriptionId: id! },
    skip: !id,
  });

  const subscription = data?.getSubscriptionStatus;
  const [isSubmittingDemographics, setIsSubmittingDemographics] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isActivatingPlan, setIsActivatingPlan] = useState(false);

  const [uploadFamilyDemographics] = useMutation(UPLOAD_FAMILY_DEMOGRAPHICS_MUTATION);
  const [uploadFiles] = useMutation(UPLOAD_FILES_MUTATION);
  const [activatePlan] = useMutation(ACTIVATE_PLAN_MUTATION);


  console.log('### subscription', subscription)
  // Get the number of spouse and children from subscription items
  const getSubscriptionItemCounts = () => {
    if (!subscription?.items) return { spouseCount: 0, childrenCount: 0 };

    const spouseCount = subscription.items.filter((item: HealthcareSubscriptionItem) => item.role === 'SPOUSE').length;
    const childrenCount = subscription.items.filter((item: HealthcareSubscriptionItem) => item.role === 'CHILD').length;

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

      notifications.show({
        title: 'Success',
        message: 'Demographic data saved successfully! Subscription status updated.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      
      // Refetch subscriptions to get updated data
      await refetch();
      
      // Reset form after successful submission
      reset(getDefaultFormValues());
    } catch (error: unknown) {
      console.error('Error saving demographic data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save demographic data. Please try again.';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setIsSubmittingDemographics(false);
    }
  };

  // File upload handlers
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data:mime/type;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB max to account for base64 overhead)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        notifications.show({
          title: 'Error',
          message: 'File size must be less than 5MB',
          color: 'red',
          icon: <IconX size={16} />,
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        notifications.show({
          title: 'Error',
          message: 'File type not allowed. Please upload PDF, JPG, PNG, GIF, or Word documents.',
          color: 'red',
          icon: <IconX size={16} />,
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !subscription?.id) return;

    setIsUploadingFiles(true);
    try {
      // Convert file to base64
      const base64Data = await convertFileToBase64(selectedFile);

      // Call the mutation
      await uploadFiles({
        variables: {
          uploadFilesInput: {
            subscriptionId: subscription.id,
            files: [{
              filename: selectedFile.name,
              mimetype: selectedFile.type,
              data: base64Data,
            }],
          },
        },
      });

      notifications.show({
        title: 'Success',
        message: 'File uploaded successfully! Subscription status updated.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      
      // Refetch subscriptions to get updated data
      await refetch();
      
      // Reset file selection
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file. Please try again.';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handlePlanActivation = async () => {
    if (!subscription?.id) return;

    setIsActivatingPlan(true);
    try {
      await activatePlan({
        variables: {
          activatePlanInput: {
            subscriptionId: subscription.id,
          },
        },
      });

      notifications.show({
        title: 'Success',
        message: 'Plan activated successfully! Your subscription is now active.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      
      // Refetch subscriptions to get updated data
      await refetch();
      
    } catch (error: unknown) {
      console.error('Error activating plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate plan. Please try again.';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setIsActivatingPlan(false);
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
        return 'green';
      case 'CANCELLED':
      case 'TERMINATED':
        return 'red';
      case 'PENDING':
        return 'blue';
      case 'DRAFT':
        return 'gray';
      case 'EXPIRED':
        return 'orange';
      default:
        return 'yellow';
    }
  };

  // Helper functions to determine workflow state based on steps
  const getCurrentWorkflowStep = () => {
    if (!subscription?.steps) return null;
    
    // If subscription is not PENDING, return the actual status
    if (subscription.status !== 'PENDING') {
      return subscription.status;
    }

    // Find the first incomplete step to determine what's needed next
    const demographicStep = subscription.steps.find(step => step.type === 'DEMOGRAPHIC_VERIFICATION');
    const documentStep = subscription.steps.find(step => step.type === 'DOCUMENT_UPLOAD');
    const activationStep = subscription.steps.find(step => step.type === 'PLAN_ACTIVATION');

    if (demographicStep?.status === 'PENDING') {
      return 'DEMOGRAPHIC_VERIFICATION_PENDING';
    } else if (documentStep?.status === 'PENDING') {
      return 'DOCUMENT_UPLOAD_PENDING';  
    } else if (activationStep?.status === 'PENDING') {
      return 'PLAN_ACTIVATION_PENDING';
    }

    return 'PENDING';
  };

  const isStepCompleted = (stepType: string) => {
    return subscription?.steps?.find(step => step.type === stepType)?.status === 'COMPLETED';
  };

  const currentStep = getCurrentWorkflowStep();


  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Card p="xl" radius="xl" shadow="lg" style={{ maxWidth: 600, margin: '0 auto' }}>
          <Stack align="center" gap="md">
            <Loader size="xl" />
            <Text size="xl" fw={500}>Loading subscription details...</Text>
          </Stack>
        </Card>
      </Container>
    );
  }

  if (error || !subscription) {
    return (
      <Container size="lg" py="xl">
        <Card p="xl" radius="xl" shadow="lg" style={{ maxWidth: 600, margin: '0 auto' }}>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="red">
              <IconFileText size={32} />
            </ThemeIcon>
            <Title order={2}>Subscription Not Found</Title>
            <Text ta="center" c="dimmed" maw={400}>
              The subscription you're looking for doesn't exist or couldn't be loaded.
            </Text>
            <Button
              onClick={() => navigate('/subscriptions')}
              leftSection={<IconArrowLeft size={16} />}
              radius="xl"
            >
              Back to Subscriptions
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
            <Anchor href="/subscriptions" c="dimmed">
              Subscriptions
            </Anchor>
            <Text fw={500}>Details</Text>
          </Breadcrumbs>

          <Group justify="apart">
            <Stack gap="xs">
              <Title order={1} size={36} fw={700}>
                Subscription Details
              </Title>
              <Text size="lg" c="dimmed">
                {subscription.type === 'INDIVIDUAL' ? 'Individual' : 'Family'} healthcare subscription
              </Text>
            </Stack>
            <Button
              onClick={() => navigate('/subscriptions')}
              variant="outline"
              radius="xl"
              leftSection={<IconArrowLeft size={16} />}
            >
              Back
            </Button>
          </Group>
        </Stack>

        <Container size="sm" p={0}>
          <Stack gap="lg">
            {/* Overview Card */}
            <Card p="lg" radius="xl" shadow="md">
              <Stack gap="md">
                <Group justify="apart" align="flex-start">
                  <Title order={3} fw={600}>Overview</Title>
                  <Badge color={getStatusColor(currentStep || subscription.status)} variant="light" size="lg">
                    {(currentStep || subscription.status).toLowerCase().replace(/_/g, ' ')}
                  </Badge>
                </Group>
                
                <Text c="dimmed">
                  Subscription ID: {subscription.id}
                </Text>

                <Stack gap="md">
                  <div>
                    <Text size="sm" fw={500} c="dimmed" mb={4}>Start Date</Text>
                    <Text size="lg">{formatDate(subscription.startDate)}</Text>
                  </div>

                  {subscription.endDate && (
                    <div>
                      <Text size="sm" fw={500} c="dimmed" mb={4}>End Date</Text>
                      <Text size="lg" c="red">{formatDate(subscription.endDate)}</Text>
                    </div>
                  )}

                  <div>
                    <Text size="sm" fw={500} c="dimmed" mb={4}>Billing Anchor</Text>
                    <Text size="lg">{subscription.billingAnchor} of each month</Text>
                  </div>

                  <div>
                    <Text size="sm" fw={500} c="dimmed" mb={4}>Type</Text>
                    <Text size="lg" tt="capitalize">{subscription.type.toLowerCase()}</Text>
                  </div>
                </Stack>
              </Stack>
            </Card>

            {/* Demographic Data Entry - Only show if current step is DEMOGRAPHIC_VERIFICATION_PENDING */}
            {currentStep === 'DEMOGRAPHIC_VERIFICATION_PENDING' && (
              <Card p="lg" radius="xl" shadow="md">
                <Stack gap="lg">
                  <Group gap="sm">
                    <IconUsers size={20} />
                    <Title order={3} fw={600}>Demographic Verification</Title>
                  </Group>
                  
                  <Text c="dimmed">
                    Please provide demographic information for family members covered under this subscription.
                  </Text>

                  <form onSubmit={handleSubmit(onSubmitDemographics)}>
                    <Stack gap="xl">
                      {/* Spouse Section - Only show if subscription has spouse */}
                      {spouseCount > 0 && (
                        <Stack gap="md">
                          <Group gap="sm">
                            <IconUser size={16} style={{ opacity: 0.6 }} />
                            <Title order={4} fw={600}>Spouse Information</Title>
                          </Group>

                          <Card p="md" radius="md" bg="gray.1">
                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                              <Stack gap="xs">
                                <Text size="sm" fw={500}>First Name *</Text>
                                <TextInput
                                  {...register('spouse.firstName')}
                                  placeholder="Enter first name"
                                  error={errors.spouse?.firstName?.message}
                                />
                              </Stack>

                              <Stack gap="xs">
                                <Text size="sm" fw={500}>Last Name *</Text>
                                <TextInput
                                  {...register('spouse.lastName')}
                                  placeholder="Enter last name"
                                  error={errors.spouse?.lastName?.message}
                                />
                              </Stack>

                              <Stack gap="xs">
                                <Text size="sm" fw={500}>Government ID *</Text>
                                <TextInput
                                  {...register('spouse.governmentId')}
                                  placeholder="e.g., SSN-123456789"
                                  error={errors.spouse?.governmentId?.message}
                                />
                              </Stack>

                              <Stack gap="xs">
                                <Text size="sm" fw={500}>Birth Date *</Text>
                                <TextInput
                                  type="date"
                                  {...register('spouse.birthDate')}
                                  error={errors.spouse?.birthDate?.message}
                                />
                              </Stack>
                            </SimpleGrid>
                          </Card>
                        </Stack>
                      )}

                      {/* Children Section - Only show if subscription has children */}
                      {childrenCount > 0 && (
                        <Stack gap="md">
                          <Group gap="sm">
                            <IconUsers size={16} style={{ opacity: 0.6 }} />
                            <Title order={4} fw={600}>
                              Children Information ({childrenCount} {childrenCount === 1 ? 'child' : 'children'})
                            </Title>
                          </Group>

                          <Stack gap="md">
                            {Array.from({ length: childrenCount }, (_, index) => (
                              <Card key={index} p="md" radius="md" bg="gray.1">
                                <Stack gap="md">
                                  <Title order={5} fw={500}>Child #{index + 1}</Title>

                                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                    <Stack gap="xs">
                                      <Text size="sm" fw={500}>First Name *</Text>
                                      <TextInput
                                        {...register(`children.${index}.firstName`)}
                                        placeholder="Enter first name"
                                        error={errors.children?.[index]?.firstName?.message}
                                      />
                                    </Stack>

                                    <Stack gap="xs">
                                      <Text size="sm" fw={500}>Last Name *</Text>
                                      <TextInput
                                        {...register(`children.${index}.lastName`)}
                                        placeholder="Enter last name"
                                        error={errors.children?.[index]?.lastName?.message}
                                      />
                                    </Stack>

                                    <Stack gap="xs">
                                      <Text size="sm" fw={500}>Government ID *</Text>
                                      <TextInput
                                        {...register(`children.${index}.governmentId`)}
                                        placeholder="e.g., SSN-123456789"
                                        error={errors.children?.[index]?.governmentId?.message}
                                      />
                                    </Stack>

                                    <Stack gap="xs">
                                      <Text size="sm" fw={500}>Birth Date *</Text>
                                      <TextInput
                                        type="date"
                                        {...register(`children.${index}.birthDate`)}
                                        error={errors.children?.[index]?.birthDate?.message}
                                      />
                                    </Stack>
                                  </SimpleGrid>
                                </Stack>
                              </Card>
                            ))}
                          </Stack>
                        </Stack>
                      )}

                      {/* Submit Button */}
                      <Group justify="end" pt="md">
                        <Button
                          type="submit"
                          loading={isSubmittingDemographics}
                          radius="xl"
                          size="md"
                        >
                          {isSubmittingDemographics ? 'Saving...' : 'Save Demographic Information'}
                        </Button>
                      </Group>
                    </Stack>
                  </form>
                </Stack>
              </Card>
            )}

            {/* Document Upload Section - Only show if current step is DOCUMENT_UPLOAD_PENDING */}
            {currentStep === 'DOCUMENT_UPLOAD_PENDING' && (
              <Card p="lg" radius="xl" shadow="md">
                <Stack gap="lg">
                  <Group gap="sm">
                    <IconUpload size={20} />
                    <Title order={3} fw={600}>Document Upload</Title>
                  </Group>
                  
                  <Text c="dimmed">
                    Please upload the required documents to proceed with your subscription.
                  </Text>

                  <Stack gap="lg">
                    {/* File Upload Area */}
                    <Card
                      p="xl"
                      radius="md"
                      style={{
                        border: '2px dashed var(--mantine-color-gray-4)',
                        backgroundColor: 'transparent',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--mantine-color-gray-6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--mantine-color-gray-4)';
                      }}
                    >
                      <Stack align="center" gap="md">
                        <ThemeIcon size={48} radius="xl" color="gray" variant="light">
                          <IconUpload size={24} />
                        </ThemeIcon>
                        <Title order={4}>Upload Document</Title>
                        <Text c="dimmed" size="sm">
                          Accepted formats: PDF, JPG, PNG, GIF, Word documents (max 5MB)
                        </Text>
                        <input
                          id="file-input"
                          type="file"
                          onChange={handleFileSelect}
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                          style={{ display: 'none' }}
                        />
                        <Button
                          onClick={() => document.getElementById('file-input')?.click()}
                          radius="xl"
                          disabled={isUploadingFiles}
                        >
                          Choose File
                        </Button>
                      </Stack>
                    </Card>

                    {/* Selected File Display */}
                    {selectedFile && (
                      <Card p="md" radius="md" bg="gray.1">
                        <Group justify="apart">
                          <Group gap="md">
                            <ThemeIcon size={40} radius="md" color="gray" variant="light">
                              <IconFileText size={20} />
                            </ThemeIcon>
                            <Stack gap={4}>
                              <Text fw={500}>{selectedFile.name}</Text>
                              <Text size="sm" c="dimmed">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                              </Text>
                            </Stack>
                          </Group>
                          <Group gap="xs">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={removeSelectedFile}
                              disabled={isUploadingFiles}
                              radius="xl"
                            >
                              Remove
                            </Button>
                            <Button
                              onClick={handleFileUpload}
                              loading={isUploadingFiles}
                              size="sm"
                              radius="xl"
                            >
                              {isUploadingFiles ? 'Uploading...' : 'Upload'}
                            </Button>
                          </Group>
                        </Group>
                      </Card>
                    )}

                    <Alert color="blue" radius="md">
                      <Stack gap="xs">
                        <Text fw={500}>Required Documents:</Text>
                        <Text size="sm">
                          • Government-issued ID for all family members<br />
                          • Proof of employment<br />
                          • Previous insurance documentation (if applicable)
                        </Text>
                      </Stack>
                    </Alert>
                  </Stack>
                </Stack>
              </Card>
            )}

            {/* Plan Activation Pending - Only show if current step is PLAN_ACTIVATION_PENDING */}
            {currentStep === 'PLAN_ACTIVATION_PENDING' && (
              <Card p="lg" radius="xl" shadow="md">
                <Stack gap="lg">
                  <Group gap="sm">
                    <IconClock size={20} style={{ color: 'var(--mantine-color-orange-6)' }} />
                    <Title order={3} fw={600}>Plan Activation Pending</Title>
                  </Group>
                  
                  <Text c="dimmed">
                    Your documents have been received and are being reviewed.
                  </Text>

                  <Stack gap="lg">
                    <Alert color="orange" radius="md">
                      <Group gap="md" align="flex-start">
                        <ThemeIcon size={24} color="orange" variant="light">
                          <IconClock size={16} />
                        </ThemeIcon>
                        <Stack gap="xs" style={{ flex: 1 }}>
                          <Text fw={500}>Ready for Activation</Text>
                          <Text size="sm">
                            Your documents and demographic information have been reviewed and approved. 
                            You can now activate your healthcare plan.
                          </Text>
                          <Button
                            onClick={handlePlanActivation}
                            loading={isActivatingPlan}
                            color="green"
                            radius="xl"
                            size="sm"
                            mt="sm"
                          >
                            {isActivatingPlan ? 'Activating...' : 'Activate Plan'}
                          </Button>
                        </Stack>
                      </Group>
                    </Alert>
                    
                    {subscription.files && subscription.files.length > 0 && (
                      <Stack gap="md">
                        <Title order={5} fw={500}>Submitted Documents:</Title>
                        <Stack gap="xs">
                          {subscription.files.map((file: HealthcareSubscriptionFile) => (
                            <Card key={file.id} p="md" radius="md" bg="gray.1">
                              <Group gap="md">
                                <ThemeIcon size={40} radius="md" color="gray" variant="light">
                                  <IconFileText size={20} />
                                </ThemeIcon>
                                <Stack gap={4} style={{ flex: 1 }}>
                                  <Text fw={500}>{file.originalName}</Text>
                                  <Text size="sm" c="dimmed">
                                    {(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB • {file.mimeType}
                                  </Text>
                                </Stack>
                                <ThemeIcon size={24} color="green" variant="light">
                                  <IconCheck size={16} />
                                </ThemeIcon>
                              </Group>
                            </Card>
                          ))}
                        </Stack>
                      </Stack>
                    )}
                  </Stack>
                </Stack>
              </Card>
            )}

            {/* Active Status - Only show if status is ACTIVE */}
            {subscription.status === 'ACTIVE' && (
              <Card p="lg" radius="xl" shadow="md">
                <Stack gap="lg">
                  <Group gap="sm">
                    <IconCheck size={20} style={{ color: 'var(--mantine-color-green-6)' }} />
                    <Title order={3} fw={600}>Active Subscription</Title>
                  </Group>
                  
                  <Text c="dimmed">
                    Your healthcare subscription is now active and ready to use.
                  </Text>

                  <Stack gap="lg">
                    <Alert color="green" radius="md">
                      <Group gap="md" align="flex-start">
                        <ThemeIcon size={24} color="green" variant="light">
                          <IconCheck size={16} />
                        </ThemeIcon>
                        <Stack gap="md" style={{ flex: 1 }}>
                          <Text fw={500}>Subscription Active</Text>
                          <Text size="sm">
                            Congratulations! Your healthcare subscription is now active. You can start using your benefits immediately.
                          </Text>
                          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mt="sm">
                            <Card p="md" radius="md" withBorder>
                              <Stack gap="xs">
                                <Text fw={500}>Coverage Starts</Text>
                                <Text c="dimmed">{formatDate(subscription.startDate)}</Text>
                              </Stack>
                            </Card>
                            <Card p="md" radius="md" withBorder>
                              <Stack gap="xs">
                                <Text fw={500}>Monthly Billing</Text>
                                <Text c="dimmed">{subscription.billingAnchor} of each month</Text>
                              </Stack>
                            </Card>
                          </SimpleGrid>
                        </Stack>
                      </Group>
                    </Alert>

                    <Stack gap="md">
                      <Title order={5} fw={500}>Covered Members:</Title>
                      <Stack gap="xs">
                        {subscription.items?.map((item: HealthcareSubscriptionItem) => (
                          <Card key={item.id} p="md" radius="md" bg="gray.1">
                            <Group gap="md">
                              <ThemeIcon size={40} radius="md" color="gray" variant="light">
                                <IconUser size={20} />
                              </ThemeIcon>
                              <Stack gap={4} style={{ flex: 1 }}>
                                <Text fw={500} tt="capitalize">{item.role.toLowerCase()}</Text>
                                {item.demographicId && (
                                  <Text size="sm" c="dimmed">Verified</Text>
                                )}
                              </Stack>
                              <ThemeIcon size={24} color="green" variant="light">
                                <IconCheck size={16} />
                              </ThemeIcon>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    </Stack>
                  </Stack>
                </Stack>
              </Card>
            )}

            {/* Progress Indicator for PENDING status */}
            {subscription.status === 'PENDING' && subscription.steps && (
              <Card p="lg" radius="xl" shadow="md">
                <Stack gap="lg">
                  <Group gap="sm">
                    <IconClock size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
                    <Title order={3} fw={600}>Enrollment Progress</Title>
                  </Group>
                  
                  <Text c="dimmed">
                    Track the progress of your subscription enrollment.
                  </Text>

                  <Stack gap="md">
                    {subscription.steps.map((step) => (
                      <Card key={step.id} p="md" radius="md" bg={step.status === 'COMPLETED' ? 'green.1' : 'gray.1'}>
                        <Group gap="md">
                          <ThemeIcon 
                            size={40} 
                            radius="md" 
                            color={step.status === 'COMPLETED' ? 'green' : 'gray'} 
                            variant="light"
                          >
                            {step.status === 'COMPLETED' ? <IconCheck size={20} /> : <IconClock size={20} />}
                          </ThemeIcon>
                          <Stack gap={4} style={{ flex: 1 }}>
                            <Text fw={500}>
                              {step.type === 'DEMOGRAPHIC_VERIFICATION' && 'Demographic Verification'}
                              {step.type === 'DOCUMENT_UPLOAD' && 'Document Upload'}
                              {step.type === 'PLAN_ACTIVATION' && 'Plan Activation'}
                            </Text>
                            <Text size="sm" c="dimmed">
                              {step.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                              {step.completedAt && ` on ${formatDate(step.completedAt)}`}
                            </Text>
                          </Stack>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            )}

            {/* Draft Status - Only show if status is DRAFT */}
            {subscription.status === 'DRAFT' && (
              <Card p="lg" radius="xl" shadow="md">
                <Stack gap="lg">
                  <Group gap="sm">
                    <IconClock size={20} style={{ color: 'var(--mantine-color-gray-6)' }} />
                    <Title order={3} fw={600}>Draft Subscription</Title>
                  </Group>
                  
                  <Text c="dimmed">
                    This subscription is in draft status and has not been activated yet.
                  </Text>

                  <Alert color="gray" radius="md">
                    <Group gap="md" align="flex-start">
                      <ThemeIcon size={24} color="gray" variant="light">
                        <IconClock size={16} />
                      </ThemeIcon>
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Text fw={500}>Waiting for Activation</Text>
                        <Text size="sm">
                          This subscription needs to be activated to begin the enrollment process.
                        </Text>
                      </Stack>
                    </Group>
                  </Alert>
                </Stack>
              </Card>
            )}

            {/* Cancelled/Terminated Status - Only show if status is CANCELLED or TERMINATED */}
            {(subscription.status === 'CANCELLED' || subscription.status === 'TERMINATED') && (
              <Card p="lg" radius="xl" shadow="md">
                <Stack gap="lg">
                  <Group gap="sm">
                    <IconX size={20} style={{ color: 'var(--mantine-color-red-6)' }} />
                    <Title order={3} fw={600}>
                      {subscription.status === 'CANCELLED' ? 'Subscription Cancelled' : 'Subscription Terminated'}
                    </Title>
                  </Group>
                  
                  <Text c="dimmed">
                    This subscription is no longer active.
                  </Text>

                  <Alert color="red" radius="md">
                    <Group gap="md" align="flex-start">
                      <ThemeIcon size={24} color="red" variant="light">
                        <IconAlertCircle size={16} />
                      </ThemeIcon>
                      <Stack gap="md" style={{ flex: 1 }}>
                        <Text fw={500}>
                          {subscription.status === 'CANCELLED' ? 'Cancelled' : 'Terminated'}
                        </Text>
                        <Text size="sm">
                          {subscription.status === 'CANCELLED' 
                            ? 'This subscription has been cancelled and is no longer providing coverage.'
                            : 'This subscription has been terminated and is no longer providing coverage.'
                          }
                        </Text>
                        {subscription.endDate && (
                          <Card p="md" radius="md" withBorder mt="sm">
                            <Stack gap="xs">
                              <Text fw={500}>Coverage Ended</Text>
                              <Text c="dimmed">{formatDate(subscription.endDate)}</Text>
                            </Stack>
                          </Card>
                        )}
                      </Stack>
                    </Group>
                  </Alert>
                </Stack>
              </Card>
            )}
          </Stack>
        </Container>
      </Stack>
    </Container>
  );
};

export default SubscriptionDetails;