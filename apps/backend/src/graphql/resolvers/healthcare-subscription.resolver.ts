import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { HealthcareSubscription, SubscriptionStatus } from '../types';
import { CreateSubscriptionInput } from '../dto/create-subscription.input';
import { UploadFamilyDemographicsInput } from '../dto/upload-family-demographics.input';
import { FamilyDemographicsService } from '../../services/family-demographics.service';
import { getHealthcareSubscriptionType } from 'src/utils/healthcare-subscription.utils';
import { Prisma } from '@prisma/client';
import { toId } from 'src/utils';

type SubWithRelations = Prisma.HealthcareSubscriptionGetPayload<{
  include: {
    items: true;
    files: true;
    employee: {
      include: {
        demographics: true;
      };
    };
    plan: true;
  };
}>;

@Resolver()
export class HealthcareSubscriptionResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly familyDemographicsService: FamilyDemographicsService,
  ) {}

  @Query(() => [HealthcareSubscription], {
    name: 'getSubscriptions',
    description: 'Get all healthcare subscriptions',
  })
  async getSubscriptions() {
    const rows: SubWithRelations[] =
      await this.prisma.healthcareSubscription.findMany({
        include: {
          items: true,
          files: true,
          employee: {
            include: {
              demographics: true,
            },
          },
          plan: true,
        },
        orderBy: { created_at: 'desc' },
      });

    const mapItem = (i: SubWithRelations['items'][number]) => ({
      id: toId(i.id),
      healthcareSubscriptionId: toId(i.healthcare_subscription_id),
      role: i.role,
      demographicId: i.demographic_id ? toId(i.demographic_id) : null,
      createdAt: i.created_at,
    });

    const mapFile = (f: SubWithRelations['files'][number]) => ({
      id: toId(f.id),
      healthcareSubscriptionId: toId(f.healthcare_subscription_id),
      path: f.path,
      originalName: f.original_name,
      fileSizeBytes: f.file_size_bytes,
      mimeType: f.mime_type,
      createdAt: f.created_at,
    });

    return rows.map((s) => {
      return {
        id: toId(s.id),
        companyId: toId(s.company_id),
        employeeId: toId(s.employee_id),
        type: s.type,
        status: s.status,
        planId: toId(s.plan_id),
        startDate: s.start_date,
        endDate: s.end_date ?? null,
        billingAnchor: s.billing_anchor,
        createdAt: s.created_at,

        employee: s.employee
          ? {
              id: toId(s.employee.id),
              companyId: toId(s.employee.company_id),
              demographicsId: toId(s.employee.demographics_id),
              email: s.employee.email,
              birthDate: s.employee.birth_date,
              maritalStatus: s.employee.marital_status,
              createdAt: s.employee.created_at,
              demographic: {
                id: toId(s.employee.demographics.id),
                firstName: s.employee.demographics.first_name,
                lastName: s.employee.demographics.last_name,
                governmentId: s.employee.demographics.government_id,
                birthDate: s.employee.demographics.birth_date,
                createdAt: s.employee.demographics.created_at,
              },
            }
          : null,

        plan: s.plan
          ? {
              id: toId(s.plan.id),
              name: s.plan.name,
              costEmployeeCents: s.plan.cost_employee_cents.toString(),
              pctEmployeePaidByCompany:
                s.plan.pct_employee_paid_by_company.toString(),
              costSpouseCents: s.plan.cost_spouse_cents.toString(),
              pctSpousePaidByCompany:
                s.plan.pct_spouse_paid_by_company.toString(),
              costChildCents: s.plan.cost_child_cents.toString(),
              pctChildPaidByCompany:
                s.plan.pct_child_paid_by_company.toString(),
            }
          : null,

        items: s.items.map(mapItem),
        files: s.files.map(mapFile),
      };
    });
  }

  @Mutation(() => HealthcareSubscription)
  async createSubscription(
    @Args('createSubscriptionInput')
    createSubscriptionInput: CreateSubscriptionInput,
  ) {
    // First, get the employee to access their demographic ID
    const employee = await this.prisma.employee.findUnique({
      where: { id: BigInt(createSubscriptionInput.employeeId) },
      select: { demographics_id: true },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Create the subscription
    const subscription = await this.prisma.healthcareSubscription.create({
      data: {
        employee_id: BigInt(createSubscriptionInput.employeeId),
        billing_anchor: new Date().getDate(),
        company_id: 1,
        plan_id: createSubscriptionInput.planId,
        start_date: new Date(),
        status: SubscriptionStatus.DEMOGRAPHIC_VERIFICATION_PENDING,
        type: getHealthcareSubscriptionType(
          createSubscriptionInput.includeSpouse,
          createSubscriptionInput.numOfChildren,
        ),
      },
    });

    // Create subscription items for family members
    const itemsToCreate: Prisma.HealthcareSubscriptionItemCreateManyInput[] =
      [];

    // 1. Always create an employee item linking to their existing demographic
    itemsToCreate.push({
      role: 'employee' as const,
      healthcare_subscription_id: subscription.id,
      demographic_id: employee.demographics_id,
    });

    // 2. Create spouse item if family subscription includes spouse
    if (createSubscriptionInput.includeSpouse) {
      itemsToCreate.push({
        healthcare_subscription_id: subscription.id,
        role: 'spouse' as const,
      });
    }

    // 3. Create children items based on numOfChildren
    for (let i = 0; i < createSubscriptionInput.numOfChildren; i++) {
      itemsToCreate.push({
        healthcare_subscription_id: subscription.id,
        role: 'child' as const,
      });
    }

    // Create all subscription items
    await this.prisma.healthcareSubscriptionItem.createMany({
      data: itemsToCreate,
    });

    return {
      id: subscription.id.toString(),
      companyId: subscription.company_id.toString(),
      employeeId: subscription.employee_id.toString(),
      type: subscription.type,
      status: subscription.status,
      planId: subscription.plan_id.toString(),
      startDate: subscription.start_date,
      endDate: subscription.end_date,
      billingAnchor: subscription.billing_anchor,
      createdAt: subscription.created_at,
    };
  }

  @Mutation(() => HealthcareSubscription)
  async uploadFamilyDemographics(
    @Args('uploadFamilyDemographicsInput')
    uploadFamilyDemographicsInput: UploadFamilyDemographicsInput,
  ) {
    const result = await this.familyDemographicsService.validateAndUploadFamilyDemographics(
      uploadFamilyDemographicsInput
    );

    // Return the updated subscription with new status
    const updatedSubscription = await this.prisma.healthcareSubscription.findUnique({
      where: { id: result.subscription.id },
      include: {
        items: true,
        files: true,
        employee: {
          include: {
            demographics: true,
          },
        },
        plan: true,
      },
    });

    if (!updatedSubscription) {
      throw new Error('Updated subscription not found');
    }

    // Map the response similar to getSubscriptions
    const mapItem = (i: any) => ({
      id: toId(i.id),
      healthcareSubscriptionId: toId(i.healthcare_subscription_id),
      role: i.role,
      demographicId: i.demographic_id ? toId(i.demographic_id) : null,
      createdAt: i.created_at,
    });

    const mapFile = (f: any) => ({
      id: toId(f.id),
      healthcareSubscriptionId: toId(f.healthcare_subscription_id),
      path: f.path,
      originalName: f.original_name,
      fileSizeBytes: f.file_size_bytes,
      mimeType: f.mime_type,
      createdAt: f.created_at,
    });

    return {
      id: toId(updatedSubscription.id),
      companyId: toId(updatedSubscription.company_id),
      employeeId: toId(updatedSubscription.employee_id),
      type: updatedSubscription.type,
      status: updatedSubscription.status,
      planId: toId(updatedSubscription.plan_id),
      startDate: updatedSubscription.start_date,
      endDate: updatedSubscription.end_date ?? null,
      billingAnchor: updatedSubscription.billing_anchor,
      createdAt: updatedSubscription.created_at,

      employee: updatedSubscription.employee
        ? {
            id: toId(updatedSubscription.employee.id),
            companyId: toId(updatedSubscription.employee.company_id),
            demographicsId: toId(updatedSubscription.employee.demographics_id),
            email: updatedSubscription.employee.email,
            birthDate: updatedSubscription.employee.birth_date,
            maritalStatus: updatedSubscription.employee.marital_status,
            createdAt: updatedSubscription.employee.created_at,
            demographic: {
              id: toId(updatedSubscription.employee.demographics.id),
              firstName: updatedSubscription.employee.demographics.first_name,
              lastName: updatedSubscription.employee.demographics.last_name,
              governmentId: updatedSubscription.employee.demographics.government_id,
              birthDate: updatedSubscription.employee.demographics.birth_date,
              createdAt: updatedSubscription.employee.demographics.created_at,
            },
          }
        : null,

      plan: updatedSubscription.plan
        ? {
            id: toId(updatedSubscription.plan.id),
            name: updatedSubscription.plan.name,
            costEmployeeCents: updatedSubscription.plan.cost_employee_cents.toString(),
            pctEmployeePaidByCompany:
              updatedSubscription.plan.pct_employee_paid_by_company.toString(),
            costSpouseCents: updatedSubscription.plan.cost_spouse_cents.toString(),
            pctSpousePaidByCompany:
              updatedSubscription.plan.pct_spouse_paid_by_company.toString(),
            costChildCents: updatedSubscription.plan.cost_child_cents.toString(),
            pctChildPaidByCompany:
              updatedSubscription.plan.pct_child_paid_by_company.toString(),
          }
        : null,

      items: updatedSubscription.items.map(mapItem),
      files: updatedSubscription.files.map(mapFile),
    };
  }
}
