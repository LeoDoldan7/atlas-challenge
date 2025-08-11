import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
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

interface UseDemographicFormProps {
  subscriptionId: string;
  spouseCount: number;
  childrenCount: number;
  onSuccess: () => void;
}

export const useDemographicForm = ({
  subscriptionId,
  spouseCount,
  childrenCount,
  onSuccess
}: UseDemographicFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFamilyDemographics] = useMutation(UPLOAD_FAMILY_DEMOGRAPHICS_MUTATION);

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

  const onSubmit = async (data: DemographicForm) => {
    setIsSubmitting(true);
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
            subscriptionId,
            familyMembers,
          },
        },
      });

      notifications.show({
        title: 'Success',
        message: 'Demographic data saved successfully! Subscription status updated.',
        color: 'green',
        icon: React.createElement(IconCheck, { size: 16 }),
      });
      
      onSuccess();
      
      // Reset form after successful submission
      reset(getDefaultFormValues());
    } catch (error: unknown) {
      console.error('Error saving demographic data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save demographic data. Please try again.';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: React.createElement(IconX, { size: 16 }),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
    reset,
  };
};