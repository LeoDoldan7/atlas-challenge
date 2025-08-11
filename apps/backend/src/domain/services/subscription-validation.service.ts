import {
  ItemRole,
  SubscriptionStatus,
  SubscriptionStepType,
  StepStatus,
} from '@prisma/client';

interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  memberType: ItemRole;
  memberId: string;
  createdAt: Date;
}

interface EnrollmentStep {
  id?: string;
  type: SubscriptionStepType;
  status: StepStatus;
  completedAt?: Date | null;
  createdAt?: Date;
}

export class SubscriptionValidationService {
  validateCanModifyItems(status: SubscriptionStatus): void {
    if (status !== SubscriptionStatus.PENDING) {
      throw new Error('Cannot modify items after enrollment has started');
    }
  }

  validateEmployeeAddedFirst(
    memberType: ItemRole,
    items: SubscriptionItem[],
  ): void {
    if (memberType !== ItemRole.employee && !this.hasEmployeeItem(items)) {
      throw new Error('Employee must be added before family members');
    }
  }

  validateNoDuplicateMembers(
    memberId: string,
    items: SubscriptionItem[],
  ): void {
    if (items.some((item) => item.memberId === memberId)) {
      throw new Error(`Member ${memberId} already exists in subscription`);
    }
  }

  validateChildrenLimit(memberType: ItemRole, items: SubscriptionItem[]): void {
    if (memberType === ItemRole.child) {
      const childCount = this.getChildrenCount(items);
      if (childCount >= 10) {
        throw new Error('Maximum 10 children allowed per subscription');
      }
    }
  }

  validateCanCompleteEnrollmentStep(status: SubscriptionStatus): void {
    if (status !== SubscriptionStatus.PENDING) {
      throw new Error('Cannot complete enrollment steps in current status');
    }
  }

  validateStepExists(
    stepType: SubscriptionStepType,
    steps: EnrollmentStep[],
  ): EnrollmentStep {
    const step = steps.find((s) => s.type === stepType);
    if (!step) {
      throw new Error(`Enrollment step ${stepType} not found`);
    }
    return step;
  }

  validateStepNotAlreadyCompleted(
    step: EnrollmentStep,
    stepType: SubscriptionStepType,
  ): void {
    if (step.status === StepStatus.COMPLETED) {
      throw new Error(`Step ${stepType} is already completed`);
    }
  }

  validateStepsCompletedInOrder(
    stepType: SubscriptionStepType,
    steps: EnrollmentStep[],
  ): void {
    const stepIndex = steps.findIndex((s) => s.type === stepType);
    if (stepIndex > 0) {
      const previousStep = steps[stepIndex - 1];
      if (previousStep.status !== StepStatus.COMPLETED) {
        throw new Error(
          `Must complete ${previousStep.type} before ${stepType}`,
        );
      }
    }
  }

  validateAllStepsCompleted(steps: EnrollmentStep[]): void {
    const allStepsCompleted = steps.every(
      (s) => s.status === StepStatus.COMPLETED,
    );
    if (!allStepsCompleted) {
      throw new Error(
        'Cannot activate subscription: not all steps are completed',
      );
    }
  }

  private hasEmployeeItem(items: SubscriptionItem[]): boolean {
    return items.some((item) => item.memberType === ItemRole.employee);
  }

  private getChildrenCount(items: SubscriptionItem[]): number {
    return items.filter((i) => i.memberType === ItemRole.child).length;
  }
}
