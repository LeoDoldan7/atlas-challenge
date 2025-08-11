import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HealthcareSubscriptionService } from './healthcare-subscription.service';
import { HealthcareSubscriptionRepository } from './healthcare-subscription.repository';
import { HealthcareSubscriptionMapper } from './healthcare-subscription.mapper';
import { FamilyDemographicsService } from '../family-demographics/family-demographics.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { PlanActivationService } from '../plan-activation/plan-activation.service';
import { HealthcarePlanMapper } from '../healthcare-plan/healthcare-plan.mapper';
import { EmployeeMapper } from '../employee/employee.mapper';
import { DemographicMapper } from '../demographic/demographic.mapper';
import { WalletMapper } from '../wallet/wallet.mapper';
import { FamilyDemographicsRepository } from '../family-demographics/family-demographics.repository';
import { FileUploadRepository } from '../file-upload/file-upload.repository';
import { PlanActivationRepository } from '../plan-activation/plan-activation.repository';
import { MinioService } from '../minio/minio.service';
import {
  SubscriptionStatus,
  StepStatus,
  SubscriptionStepType,
  Prisma,
} from '@prisma/client';

describe('HealthcareSubscription Integration Tests', () => {
  let app: INestApplication;
  let service: HealthcareSubscriptionService;
  let prisma: PrismaService;
  let testCompanyId: bigint;
  let testEmployeeId: bigint;
  let testPlanId: bigint;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        HealthcareSubscriptionService,
        HealthcareSubscriptionRepository,
        HealthcareSubscriptionMapper,
        FamilyDemographicsService,
        FamilyDemographicsRepository,
        FileUploadService,
        FileUploadRepository,
        PlanActivationService,
        PlanActivationRepository,
        HealthcarePlanMapper,
        EmployeeMapper,
        DemographicMapper,
        WalletMapper,
        {
          provide: MinioService,
          useValue: {
            uploadFile: jest.fn(),
            getFileUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<HealthcareSubscriptionService>(
      HealthcareSubscriptionService,
    );
    prisma = module.get<PrismaService>(PrismaService);

    // Create test data
    const company = await prisma.company.create({
      data: {
        name: 'Test Company',
        country_iso_code: 'US',
      },
    });
    testCompanyId = company.id;

    const plan = await prisma.healthcarePlan.create({
      data: {
        name: 'Test Plan',
        cost_employee_cents: 50000n, // $500
        cost_spouse_cents: 60000n, // $600
        cost_child_cents: 30000n, // $300
        pct_employee_paid_by_company: new Prisma.Decimal(100), // 100% company paid
        pct_spouse_paid_by_company: new Prisma.Decimal(100),
        pct_child_paid_by_company: new Prisma.Decimal(100),
      },
    });
    testPlanId = plan.id;

    const demographic = await prisma.demographic.create({
      data: {
        first_name: 'Test',
        last_name: 'User',
        government_id: 'TEST-123456',
        birth_date: new Date('1990-01-01'),
      },
    });

    const employee = await prisma.employee.create({
      data: {
        email: 'test@example.com',
        birth_date: new Date('1990-01-01'),
        marital_status: 'single',
        demographics_id: demographic.id,
        company_id: testCompanyId,
        wallet: {
          create: {
            balance_cents: 100000n, // $1000
            currency_code: 'USD',
          },
        },
      },
    });
    testEmployeeId = employee.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.healthcareSubscriptionFile.deleteMany();
    await prisma.subscriptionStep.deleteMany();
    await prisma.healthcareSubscriptionItem.deleteMany();
    await prisma.healthcareSubscription.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.demographic.deleteMany();
    await prisma.healthcarePlan.deleteMany();
    await prisma.company.deleteMany();

    await prisma.$disconnect();
    await app.close();
  });

  describe('Bug: PENDING subscriptions cannot progress', () => {
    it('should create subscription with PENDING status and enrollment steps', async () => {
      const result = await service.createSubscription({
        employeeId: Number(testEmployeeId),
        planId: Number(testPlanId),
        includeSpouse: false,
        numOfChildren: 0,
      });

      expect(result.status).toBe('PENDING');

      // Check that enrollment steps were created
      const dbSubscription = await prisma.healthcareSubscription.findUnique({
        where: { id: BigInt(result.id) },
        include: { steps: true },
      });

      expect(dbSubscription?.steps).toHaveLength(3);
      expect(dbSubscription?.steps.map((s) => s.type)).toEqual(
        expect.arrayContaining([
          'DEMOGRAPHIC_VERIFICATION',
          'DOCUMENT_UPLOAD',
          'PLAN_ACTIVATION',
        ]),
      );
      expect(dbSubscription?.steps.every((s) => s.status === 'PENDING')).toBe(
        true,
      );
    });

    it('should allow progression through enrollment steps', async () => {
      const subscription = await service.createSubscription({
        employeeId: Number(testEmployeeId),
        planId: Number(testPlanId),
        includeSpouse: false,
        numOfChildren: 0,
      });

      // Complete demographic verification
      await service.uploadFamilyDemographics({
        subscriptionId: subscription.id,
        familyMembers: [],
      });

      const step1 = await prisma.subscriptionStep.findFirst({
        where: {
          healthcare_subscription_id: BigInt(subscription.id),
          type: SubscriptionStepType.DEMOGRAPHIC_VERIFICATION,
        },
      });
      expect(step1?.status).toBe(StepStatus.COMPLETED);

      // Complete document upload
      await service.uploadFiles({
        subscriptionId: subscription.id,
        files: [],
      });

      const step2 = await prisma.subscriptionStep.findFirst({
        where: {
          healthcare_subscription_id: BigInt(subscription.id),
          type: SubscriptionStepType.DOCUMENT_UPLOAD,
        },
      });
      expect(step2?.status).toBe(StepStatus.COMPLETED);
    });
  });

  describe('Bug: 100% company contribution not displayed correctly', () => {
    it('should correctly save 100% company contribution percentages', async () => {
      const result = await service.createSubscription({
        employeeId: Number(testEmployeeId),
        planId: Number(testPlanId),
        includeSpouse: false,
        numOfChildren: 0,
      });

      const dbSubscription = await prisma.healthcareSubscription.findUnique({
        where: { id: BigInt(result.id) },
        include: { items: true },
      });

      expect(dbSubscription?.items[0].company_pct).toBe(100);
      expect(dbSubscription?.items[0].employee_pct).toBe(0);
    });

    it('should correctly handle various percentage splits', async () => {
      const testCases = [
        { company: 0, employee: 100 },
        { company: 25, employee: 75 },
        { company: 50, employee: 50 },
        { company: 75, employee: 25 },
        { company: 100, employee: 0 },
      ];

      for (const testCase of testCases) {
        // Update plan percentages
        await prisma.healthcarePlan.update({
          where: { id: testPlanId },
          data: {
            pct_employee_paid_by_company: new Prisma.Decimal(testCase.company),
          },
        });

        const result = await service.createSubscription({
          employeeId: Number(testEmployeeId),
          planId: Number(testPlanId),
          includeSpouse: false,
          numOfChildren: 0,
        });

        const dbSubscription = await prisma.healthcareSubscription.findUnique({
          where: { id: BigInt(result.id) },
          include: { items: true },
        });

        expect(dbSubscription?.items[0].company_pct).toBe(testCase.company);
        expect(dbSubscription?.items[0].employee_pct).toBe(testCase.employee);
      }
    });

    it('should correctly calculate costs for family subscriptions', async () => {
      await prisma.healthcarePlan.update({
        where: { id: testPlanId },
        data: {
          pct_employee_paid_by_company: new Prisma.Decimal(80),
          pct_spouse_paid_by_company: new Prisma.Decimal(50),
          pct_child_paid_by_company: new Prisma.Decimal(100),
        },
      });

      const result = await service.createSubscription({
        employeeId: Number(testEmployeeId),
        planId: Number(testPlanId),
        includeSpouse: true,
        numOfChildren: 2,
      });

      const dbSubscription = await prisma.healthcareSubscription.findUnique({
        where: { id: BigInt(result.id) },
        include: { items: true },
      });

      expect(dbSubscription?.items).toHaveLength(4);

      // All family members use the employee percentage
      dbSubscription?.items.forEach((item) => {
        expect(item.company_pct).toBe(80);
        expect(item.employee_pct).toBe(20);
      });
    });
  });

  describe('Bug: Cannot activate subscription', () => {
    it('should prevent activation when prerequisite steps are not completed', async () => {
      const subscription = await service.createSubscription({
        employeeId: Number(testEmployeeId),
        planId: Number(testPlanId),
        includeSpouse: false,
        numOfChildren: 0,
      });

      await expect(
        service.activatePlan({
          subscriptionId: subscription.id,
        }),
      ).rejects.toThrow(
        'Step DEMOGRAPHIC_VERIFICATION must be completed before plan activation',
      );
    });

    it('should allow activation when all prerequisite steps are completed', async () => {
      const subscription = await service.createSubscription({
        employeeId: Number(testEmployeeId),
        planId: Number(testPlanId),
        includeSpouse: false,
        numOfChildren: 0,
      });

      // Complete prerequisite steps
      await prisma.subscriptionStep.updateMany({
        where: {
          healthcare_subscription_id: BigInt(subscription.id),
          type: { in: ['DEMOGRAPHIC_VERIFICATION', 'DOCUMENT_UPLOAD'] },
        },
        data: {
          status: StepStatus.COMPLETED,
          completed_at: new Date(),
        },
      });

      // Should now be able to activate
      const result = await service.activatePlan({
        subscriptionId: subscription.id,
      });

      expect(result.status).toBe('ACTIVE');

      // Verify PLAN_ACTIVATION step is completed
      const activationStep = await prisma.subscriptionStep.findFirst({
        where: {
          healthcare_subscription_id: BigInt(subscription.id),
          type: SubscriptionStepType.PLAN_ACTIVATION,
        },
      });
      expect(activationStep?.status).toBe(StepStatus.COMPLETED);
    });

    it('should handle insufficient wallet balance', async () => {
      // Create an employee with insufficient funds
      const poorDemographic = await prisma.demographic.create({
        data: {
          first_name: 'Poor',
          last_name: 'User',
          government_id: 'POOR-123456',
          birth_date: new Date('1990-01-01'),
        },
      });

      const poorEmployee = await prisma.employee.create({
        data: {
          email: 'poor@example.com',
          birth_date: new Date('1990-01-01'),
          marital_status: 'single',
          demographics_id: poorDemographic.id,
          company_id: testCompanyId,
          wallet: {
            create: {
              balance_cents: 100, // Only $1
              currency_code: 'USD',
            },
          },
        },
      });

      // Update plan to require employee payment
      await prisma.healthcarePlan.update({
        where: { id: testPlanId },
        data: {
          pct_employee_paid_by_company: new Prisma.Decimal(0), // Employee pays 100%
        },
      });

      const subscription = await service.createSubscription({
        employeeId: Number(poorEmployee.id),
        planId: Number(testPlanId),
        includeSpouse: false,
        numOfChildren: 0,
      });

      // Complete prerequisite steps
      await prisma.subscriptionStep.updateMany({
        where: {
          healthcare_subscription_id: BigInt(subscription.id),
          type: { in: ['DEMOGRAPHIC_VERIFICATION', 'DOCUMENT_UPLOAD'] },
        },
        data: {
          status: StepStatus.COMPLETED,
          completed_at: new Date(),
        },
      });

      // Should fail due to insufficient funds
      await expect(
        service.activatePlan({
          subscriptionId: subscription.id,
        }),
      ).rejects.toThrow('Insufficient funds or invalid payment allocation');
    });
  });

  describe('Custom payment percentages', () => {
    it('should correctly save custom payment percentages that override plan defaults', async () => {
      // Set plan defaults to 50% company payment
      await prisma.healthcarePlan.update({
        where: { id: testPlanId },
        data: {
          pct_employee_paid_by_company: new Prisma.Decimal(50),
          pct_spouse_paid_by_company: new Prisma.Decimal(40),
          pct_child_paid_by_company: new Prisma.Decimal(30),
        },
      });

      // Create subscription with custom 100% company payment
      const subscription = await service.createSubscription({
        employeeId: Number(testEmployeeId),
        planId: Number(testPlanId),
        includeSpouse: true,
        numOfChildren: 2,
        employeePercentages: {
          companyPercent: 100,
          employeePercent: 0,
        },
        spousePercentages: {
          companyPercent: 100,
          employeePercent: 0,
        },
        childPercentages: {
          companyPercent: 100,
          employeePercent: 0,
        },
      });

      // Verify the saved percentages
      const savedItems = await prisma.healthcareSubscriptionItem.findMany({
        where: { healthcare_subscription_id: BigInt(subscription.id) },
        orderBy: { created_at: 'asc' },
      });

      expect(savedItems).toHaveLength(4); // Employee + Spouse + 2 Children

      // All items should have 100% company payment, not the plan defaults
      savedItems.forEach((item) => {
        expect(item.company_pct).toBe(100);
        expect(item.employee_pct).toBe(0);
      });

      // Verify through GraphQL response
      expect(subscription.items).toHaveLength(4);
      subscription.items?.forEach((item) => {
        expect(item.companyPct).toBe(100);
        expect(item.employeePct).toBe(0);
      });
    });

    it('should use plan defaults when no custom percentages are provided', async () => {
      // Set plan defaults
      await prisma.healthcarePlan.update({
        where: { id: testPlanId },
        data: {
          pct_employee_paid_by_company: new Prisma.Decimal(75),
          pct_spouse_paid_by_company: new Prisma.Decimal(60),
          pct_child_paid_by_company: new Prisma.Decimal(50),
        },
      });

      // Create subscription without custom percentages
      const subscription = await service.createSubscription({
        employeeId: Number(testEmployeeId),
        planId: Number(testPlanId),
        includeSpouse: true,
        numOfChildren: 1,
      });

      // Verify the saved percentages match plan defaults
      const savedItems = await prisma.healthcareSubscriptionItem.findMany({
        where: { healthcare_subscription_id: BigInt(subscription.id) },
        orderBy: { created_at: 'asc' },
      });

      expect(savedItems).toHaveLength(3); // Employee + Spouse + 1 Child

      // All should use the same default (employee percentage)
      savedItems.forEach((item) => {
        expect(item.company_pct).toBe(75);
        expect(item.employee_pct).toBe(25);
      });
    });

    it('should handle mixed custom percentages for different member types', async () => {
      const subscription = await service.createSubscription({
        employeeId: Number(testEmployeeId),
        planId: Number(testPlanId),
        includeSpouse: true,
        numOfChildren: 1,
        employeePercentages: {
          companyPercent: 100,
          employeePercent: 0,
        },
        spousePercentages: {
          companyPercent: 50,
          employeePercent: 50,
        },
        childPercentages: {
          companyPercent: 75,
          employeePercent: 25,
        },
      });

      const savedItems = await prisma.healthcareSubscriptionItem.findMany({
        where: { healthcare_subscription_id: BigInt(subscription.id) },
        orderBy: { role: 'asc' },
      });

      const childItem = savedItems.find((item) => item.role === 'child');
      const employeeItem = savedItems.find((item) => item.role === 'employee');
      const spouseItem = savedItems.find((item) => item.role === 'spouse');

      expect(employeeItem?.company_pct).toBe(100);
      expect(employeeItem?.employee_pct).toBe(0);

      expect(spouseItem?.company_pct).toBe(50);
      expect(spouseItem?.employee_pct).toBe(50);

      expect(childItem?.company_pct).toBe(75);
      expect(childItem?.employee_pct).toBe(25);
    });
  });

  describe('State machine transitions', () => {
    it('should maintain correct state throughout enrollment flow', async () => {
      const subscription = await service.createSubscription({
        employeeId: Number(testEmployeeId),
        planId: Number(testPlanId),
        includeSpouse: false,
        numOfChildren: 0,
      });

      // Initial state
      let dbSub = await prisma.healthcareSubscription.findUnique({
        where: { id: BigInt(subscription.id) },
      });
      expect(dbSub?.status).toBe(SubscriptionStatus.PENDING);

      // Complete all steps and activate
      await prisma.subscriptionStep.updateMany({
        where: {
          healthcare_subscription_id: BigInt(subscription.id),
          type: { in: ['DEMOGRAPHIC_VERIFICATION', 'DOCUMENT_UPLOAD'] },
        },
        data: {
          status: StepStatus.COMPLETED,
          completed_at: new Date(),
        },
      });

      // Set company to pay 100% for this test
      await prisma.healthcarePlan.update({
        where: { id: testPlanId },
        data: {
          pct_employee_paid_by_company: new Prisma.Decimal(100),
        },
      });

      await service.activatePlan({
        subscriptionId: subscription.id,
      });

      // Final state
      dbSub = await prisma.healthcareSubscription.findUnique({
        where: { id: BigInt(subscription.id) },
      });
      expect(dbSub?.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });
});
