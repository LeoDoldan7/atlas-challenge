import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { HealthcareSubscription, SubscriptionStatus } from '../types';
import { CreateSubscriptionInput } from '../dto/create-subscription.input';
import { getHealthcareSubscriptionType } from 'src/utils/healthcare-subscription.utils';
import { Prisma } from '@prisma/client';
import { toId } from 'src/utils';

type SubWithRelations = Prisma.HealthcareSubscriptionGetPayload<{
  include: { items: true; files: true };
}>;

@Resolver()
export class HealthcareSubscriptionResolver {
  constructor(private readonly prisma: PrismaService) {}

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
        },
        orderBy: { created_at: 'desc' },
      });

    const mapItem = (i: SubWithRelations['items'][number]) => ({
      id: toId(i.id),
      healthcareSubscriptionId: toId(i.healthcare_subscription_id),
      role: i.role,
      demographicId: toId(i.demographic_id),
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
}
