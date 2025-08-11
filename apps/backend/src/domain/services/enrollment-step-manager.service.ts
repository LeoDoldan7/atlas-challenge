import { SubscriptionStepType, StepStatus } from '@prisma/client';

export interface EnrollmentStep {
  id?: string;
  type: SubscriptionStepType;
  status: StepStatus;
  completedAt?: Date | null;
  createdAt?: Date;
}

export class EnrollmentStepManager {
  static initializeSteps(): EnrollmentStep[] {
    return [
      {
        type: SubscriptionStepType.DEMOGRAPHIC_VERIFICATION,
        status: StepStatus.PENDING,
        createdAt: new Date(),
      },
      {
        type: SubscriptionStepType.DOCUMENT_UPLOAD,
        status: StepStatus.PENDING,
        createdAt: new Date(),
      },
      {
        type: SubscriptionStepType.PLAN_ACTIVATION,
        status: StepStatus.PENDING,
        createdAt: new Date(),
      },
    ];
  }

  static completeStep(
    steps: EnrollmentStep[],
    stepType: SubscriptionStepType,
  ): EnrollmentStep[] {
    return steps.map((step) => {
      if (step.type === stepType) {
        return {
          ...step,
          status: StepStatus.COMPLETED,
          completedAt: new Date(),
        };
      }
      return step;
    });
  }

  static areAllStepsCompleted(steps: EnrollmentStep[]): boolean {
    return steps.every((s) => s.status === StepStatus.COMPLETED);
  }
}
