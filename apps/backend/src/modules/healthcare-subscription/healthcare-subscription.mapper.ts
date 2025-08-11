import { Injectable } from '@nestjs/common';
import { HealthcareSubscription } from '../../graphql/healthcare-subscription/types/healthcare-subscription.type';
import { HealthcareSubscriptionWithRelations } from './healthcare-subscription.repository';
import { HealthcarePlanMapper } from '../healthcare-plan/healthcare-plan.mapper';
import { EmployeeMapper } from '../employee/employee.mapper';
import {
  SubscriptionType as PrismaSubscriptionType,
  SubscriptionStatus as PrismaSubscriptionStatus,
  ItemRole as PrismaItemRole,
  SubscriptionStepType as PrismaSubscriptionStepType,
  StepStatus as PrismaStepStatus,
} from '@prisma/client';
import {
  SubscriptionType,
  SubscriptionStatus,
  ItemRole,
} from '../../graphql/shared/enums';
import { HealthcareSubscriptionItem } from '../../graphql/healthcare-subscription/types/healthcare-subscription-item.type';
import { HealthcareSubscriptionFile } from '../../graphql/healthcare-subscription/types/healthcare-subscription-file.type';
import { 
  SubscriptionStep,
  SubscriptionStepType,
  StepStatus,
} from '../../graphql/healthcare-subscription/types/subscription-step.type';

@Injectable()
export class HealthcareSubscriptionMapper {
  constructor(
    private readonly planMapper: HealthcarePlanMapper,
    private readonly employeeMapper: EmployeeMapper,
  ) {}

  toGraphQL(
    subscription: HealthcareSubscriptionWithRelations,
  ): HealthcareSubscription {
    return {
      id: subscription.id.toString(),
      companyId: subscription.company_id.toString(),
      employeeId: subscription.employee_id.toString(),
      planId: subscription.plan_id.toString(),
      type: this.mapSubscriptionType(subscription.type),
      status: this.mapSubscriptionStatus(subscription.status),
      startDate: subscription.start_date,
      endDate: subscription.end_date || undefined,
      billingAnchor: subscription.billing_anchor,
      lastPaymentAt: subscription.last_payment_at || undefined,
      createdAt: subscription.created_at,
      employee: subscription.employee
        ? this.employeeMapper.toGraphQL(subscription.employee)
        : undefined,
      plan: subscription.plan
        ? this.planMapper.toGraphQL(subscription.plan)
        : undefined,
      items: subscription.items?.map((item) => this.mapItem(item)) || [],
      files: subscription.files?.map((file) => this.mapFile(file)) || [],
      steps: subscription.steps?.map((step) => this.mapStep(step)) || [],
    };
  }

  private mapSubscriptionType(type: PrismaSubscriptionType): SubscriptionType {
    switch (type) {
      case PrismaSubscriptionType.individual:
        return SubscriptionType.INDIVIDUAL;
      case PrismaSubscriptionType.family:
        return SubscriptionType.FAMILY;
      default:
        return SubscriptionType.INDIVIDUAL;
    }
  }

  private mapSubscriptionStatus(
    status: PrismaSubscriptionStatus,
  ): SubscriptionStatus {
    switch (status) {
      case PrismaSubscriptionStatus.DRAFT:
        return SubscriptionStatus.DRAFT;
      case PrismaSubscriptionStatus.PENDING:
        return SubscriptionStatus.PENDING;
      case PrismaSubscriptionStatus.ACTIVE:
        return SubscriptionStatus.ACTIVE;
      case PrismaSubscriptionStatus.CANCELLED:
        return SubscriptionStatus.CANCELLED;
      case PrismaSubscriptionStatus.EXPIRED:
        return SubscriptionStatus.EXPIRED;
      default:
        return SubscriptionStatus.DRAFT;
    }
  }

  private mapItemRole(role: PrismaItemRole): ItemRole {
    switch (role) {
      case PrismaItemRole.employee:
        return ItemRole.EMPLOYEE;
      case PrismaItemRole.spouse:
        return ItemRole.SPOUSE;
      case PrismaItemRole.child:
        return ItemRole.CHILD;
      default:
        return ItemRole.EMPLOYEE;
    }
  }

  private mapItem(
    item: HealthcareSubscriptionWithRelations['items'][0],
  ): HealthcareSubscriptionItem {
    return {
      id: item.id.toString(),
      healthcareSubscriptionId: item.healthcare_subscription_id.toString(),
      role: this.mapItemRole(item.role),
      demographicId: item.demographic_id?.toString(),
      createdAt: item.created_at,
    };
  }

  private mapFile(
    file: HealthcareSubscriptionWithRelations['files'][0],
  ): HealthcareSubscriptionFile {
    return {
      id: file.id.toString(),
      healthcareSubscriptionId: file.healthcare_subscription_id.toString(),
      path: file.path,
      originalName: file.original_name,
      fileSizeBytes: file.file_size_bytes,
      mimeType: file.mime_type,
      createdAt: file.created_at,
    };
  }

  private mapStep(
    step: HealthcareSubscriptionWithRelations['steps'][0],
  ): SubscriptionStep {
    return {
      id: step.id.toString(),
      healthcareSubscriptionId: step.healthcare_subscription_id.toString(),
      type: this.mapSubscriptionStepType(step.type),
      status: this.mapStepStatus(step.status),
      createdAt: step.created_at,
      completedAt: step.completed_at || undefined,
    };
  }

  private mapSubscriptionStepType(
    type: PrismaSubscriptionStepType,
  ): SubscriptionStepType {
    switch (type) {
      case PrismaSubscriptionStepType.DEMOGRAPHIC_VERIFICATION:
        return SubscriptionStepType.DEMOGRAPHIC_VERIFICATION;
      case PrismaSubscriptionStepType.DOCUMENT_UPLOAD:
        return SubscriptionStepType.DOCUMENT_UPLOAD;
      case PrismaSubscriptionStepType.PLAN_ACTIVATION:
        return SubscriptionStepType.PLAN_ACTIVATION;
      default:
        return SubscriptionStepType.DEMOGRAPHIC_VERIFICATION;
    }
  }

  private mapStepStatus(status: PrismaStepStatus): StepStatus {
    switch (status) {
      case PrismaStepStatus.PENDING:
        return StepStatus.PENDING;
      case PrismaStepStatus.COMPLETED:
        return StepStatus.COMPLETED;
      default:
        return StepStatus.PENDING;
    }
  }
}
