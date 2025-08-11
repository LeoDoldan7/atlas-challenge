import { Test, TestingModule } from '@nestjs/testing';
import { HealthcareSubscriptionService } from './healthcare-subscription.service';
import {
  HealthcareSubscriptionRepository,
  HealthcareSubscriptionWithRelations,
} from './healthcare-subscription.repository';
import { HealthcareSubscriptionMapper } from './healthcare-subscription.mapper';
import { FamilyDemographicsService } from '../family-demographics/family-demographics.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { PlanActivationService } from '../plan-activation/plan-activation.service';
import { CreateSubscriptionInput } from '../../graphql/healthcare-subscription/dto/create-subscription.input';
import { SubscriptionStatus, Prisma } from '@prisma/client';
import { HealthcareSubscription } from '../../graphql/healthcare-subscription/types/healthcare-subscription.type';
import {
  SubscriptionType,
  SubscriptionStatus as GraphQLSubscriptionStatus,
} from '../../graphql/shared/enums';

describe('HealthcareSubscriptionService', () => {
  let service: HealthcareSubscriptionService;
  let repository: jest.Mocked<HealthcareSubscriptionRepository>;
  let mapper: jest.Mocked<HealthcareSubscriptionMapper>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthcareSubscriptionService,
        {
          provide: HealthcareSubscriptionRepository,
          useValue: {
            findEmployeeById: jest.fn(),
            findPlanById: jest.fn(),
            createSubscriptionWithItems: jest.fn(),
            findByIdWithRelations: jest.fn(),
            updateSubscriptionStatus: jest.fn(),
            updateStepStatus: jest.fn(),
          },
        },
        {
          provide: HealthcareSubscriptionMapper,
          useValue: {
            toGraphQL: jest.fn(),
          },
        },
        {
          provide: FamilyDemographicsService,
          useValue: {
            uploadFamilyDemographics: jest.fn(),
          },
        },
        {
          provide: FileUploadService,
          useValue: {
            uploadFiles: jest.fn(),
          },
        },
        {
          provide: PlanActivationService,
          useValue: {
            activatePlan: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HealthcareSubscriptionService>(
      HealthcareSubscriptionService,
    );
    repository = module.get(HealthcareSubscriptionRepository);
    mapper = module.get(HealthcareSubscriptionMapper);
  });

  describe('createSubscription', () => {
    type EmployeeWithRelations = Prisma.EmployeeGetPayload<{
      include: { wallet: true; demographics: true };
    }>;

    type PlanType = Prisma.HealthcarePlanGetPayload<true>;

    const mockEmployee: EmployeeWithRelations = {
      id: BigInt(1),
      company_id: BigInt(1),
      demographics_id: BigInt(100),
      email: 'test@example.com',
      birth_date: new Date(),
      marital_status: 'single',
      created_at: new Date(),
      wallet: {
        id: BigInt(1),
        employee_id: BigInt(1),
        balance_cents: BigInt(10000),
        currency_code: 'USD',
        created_at: new Date(),
      },
      demographics: {
        id: BigInt(100),
        first_name: 'John',
        last_name: 'Doe',
        government_id: '123456789',
        birth_date: new Date(),
        created_at: new Date(),
      },
    };

    const mockPlan: PlanType = {
      id: BigInt(1),
      name: 'Test Plan',
      cost_employee_cents: BigInt(50000), // $500
      cost_spouse_cents: BigInt(60000), // $600
      cost_child_cents: BigInt(30000), // $300
      pct_employee_paid_by_company: new Prisma.Decimal(100), // 100% company paid
      pct_spouse_paid_by_company: new Prisma.Decimal(100),
      pct_child_paid_by_company: new Prisma.Decimal(100),
    };

    // Helper function to create a complete mock subscription
    const createMockSubscription = (
      overrides?: Partial<HealthcareSubscriptionWithRelations>,
    ): HealthcareSubscriptionWithRelations => ({
      id: BigInt(1),
      company_id: BigInt(1),
      employee_id: BigInt(1),
      plan_id: BigInt(1),
      status: SubscriptionStatus.PENDING,
      type: 'individual',
      start_date: new Date(),
      end_date: null,
      billing_anchor: 1,
      last_payment_at: null,
      created_at: new Date(),
      items: [],
      files: [],
      steps: [],
      employee: mockEmployee,
      plan: mockPlan,
      ...overrides,
    });

    const mockGraphQLSubscription: HealthcareSubscription = {
      id: '1',
      companyId: '1',
      employeeId: '1',
      planId: '1',
      status: GraphQLSubscriptionStatus.PENDING,
      type: SubscriptionType.INDIVIDUAL,
      startDate: new Date(),
      endDate: undefined,
      billingAnchor: 1,
      lastPaymentAt: undefined,
      createdAt: new Date(),
      items: [],
      files: [],
      steps: [],
    };

    it('should create subscription with 100% company contribution for employee only', async () => {
      repository.findEmployeeById.mockResolvedValue(mockEmployee);
      repository.findPlanById.mockResolvedValue(mockPlan);
      repository.createSubscriptionWithItems.mockResolvedValue(
        createMockSubscription({
          items: [
            {
              id: BigInt(1),
              healthcare_subscription_id: BigInt(1),
              role: 'employee' as const,
              demographic_id: BigInt(100),
              company_pct: 100,
              employee_pct: 0,
              created_at: new Date(),
            },
          ],
        }),
      );
      mapper.toGraphQL.mockReturnValue(mockGraphQLSubscription);

      const input: CreateSubscriptionInput = {
        employeeId: 1,
        planId: 1,
        includeSpouse: false,
        numOfChildren: 0,
      };

      await service.createSubscription(input);

      const createCall = repository.createSubscriptionWithItems.mock.calls[0];
      expect(createCall[0]).toMatchObject({
        status: SubscriptionStatus.PENDING,
      });
      expect(createCall[1]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'employee',
            company_pct: 100,
            employee_pct: 0,
          }),
        ]),
      );
    });

    it('should create family subscription with 100% company contribution', async () => {
      repository.findEmployeeById.mockResolvedValue(mockEmployee);
      repository.findPlanById.mockResolvedValue(mockPlan);
      repository.createSubscriptionWithItems.mockResolvedValue(
        createMockSubscription({
          type: 'family',
          items: [
            {
              id: BigInt(1),
              healthcare_subscription_id: BigInt(1),
              role: 'employee' as const,
              demographic_id: BigInt(100),
              company_pct: 100,
              employee_pct: 0,
              created_at: new Date(),
            },
            {
              id: BigInt(2),
              healthcare_subscription_id: BigInt(1),
              role: 'spouse' as const,
              demographic_id: null,
              company_pct: 100,
              employee_pct: 0,
              created_at: new Date(),
            },
            {
              id: BigInt(3),
              healthcare_subscription_id: BigInt(1),
              role: 'child' as const,
              demographic_id: null,
              company_pct: 100,
              employee_pct: 0,
              created_at: new Date(),
            },
          ],
        }),
      );
      mapper.toGraphQL.mockReturnValue(mockGraphQLSubscription);

      const input: CreateSubscriptionInput = {
        employeeId: 1,
        planId: 1,
        includeSpouse: true,
        numOfChildren: 1,
      };

      await service.createSubscription(input);

      const createCall = repository.createSubscriptionWithItems.mock.calls[0];
      expect(createCall[1]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'employee',
            company_pct: 100,
            employee_pct: 0,
          }),
          expect.objectContaining({
            role: 'spouse',
            company_pct: 100,
            employee_pct: 0,
          }),
          expect.objectContaining({
            role: 'child',
            company_pct: 100,
            employee_pct: 0,
          }),
        ]),
      );
    });

    it('should handle different percentage splits correctly', async () => {
      const testCases = [
        { company: 0, employee: 100 },
        { company: 25, employee: 75 },
        { company: 50, employee: 50 },
        { company: 75, employee: 25 },
        { company: 100, employee: 0 },
      ];

      for (const testCase of testCases) {
        const planWithPercentage = {
          ...mockPlan,
          pct_employee_paid_by_company: testCase.company,
        };

        repository.findEmployeeById.mockResolvedValue(mockEmployee);
        repository.findPlanById.mockResolvedValue({
          ...planWithPercentage,
          pct_employee_paid_by_company: new Prisma.Decimal(testCase.company),
          pct_spouse_paid_by_company: new Prisma.Decimal(testCase.company),
          pct_child_paid_by_company: new Prisma.Decimal(testCase.company),
        });
        repository.createSubscriptionWithItems.mockResolvedValue(
          createMockSubscription({
            items: [
              {
                id: BigInt(1),
                healthcare_subscription_id: BigInt(1),
                role: 'employee' as const,
                demographic_id: BigInt(100),
                company_pct: testCase.company,
                employee_pct: testCase.employee,
                created_at: new Date(),
              },
            ],
          }),
        );
        mapper.toGraphQL.mockReturnValue(mockGraphQLSubscription);

        const input: CreateSubscriptionInput = {
          employeeId: 1,
          planId: 1,
          includeSpouse: false,
          numOfChildren: 0,
        };

        await service.createSubscription(input);

        const createCall =
          repository.createSubscriptionWithItems.mock.calls[
            repository.createSubscriptionWithItems.mock.calls.length - 1
          ];
        expect(createCall[1]).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              role: 'employee',
              company_pct: testCase.company,
              employee_pct: testCase.employee,
            }),
          ]),
        );
      }
    });

    it('should calculate costs correctly for mixed family percentages', async () => {
      const mixedPlan: PlanType = {
        ...mockPlan,
        pct_employee_paid_by_company: new Prisma.Decimal(80),
        pct_spouse_paid_by_company: new Prisma.Decimal(50),
        pct_child_paid_by_company: new Prisma.Decimal(100),
      };

      repository.findEmployeeById.mockResolvedValue(mockEmployee);
      repository.findPlanById.mockResolvedValue(mixedPlan);
      repository.createSubscriptionWithItems.mockResolvedValue(
        createMockSubscription({
          type: 'family',
          items: [
            {
              id: BigInt(1),
              healthcare_subscription_id: BigInt(1),
              role: 'employee' as const,
              demographic_id: BigInt(100),
              company_pct: 80,
              employee_pct: 20,
              created_at: new Date(),
            },
            {
              id: BigInt(2),
              healthcare_subscription_id: BigInt(1),
              role: 'spouse' as const,
              demographic_id: null,
              company_pct: 50,
              employee_pct: 50,
              created_at: new Date(),
            },
            {
              id: BigInt(3),
              healthcare_subscription_id: BigInt(1),
              role: 'child' as const,
              demographic_id: null,
              company_pct: 100,
              employee_pct: 0,
              created_at: new Date(),
            },
            {
              id: BigInt(4),
              healthcare_subscription_id: BigInt(1),
              role: 'child' as const,
              demographic_id: null,
              company_pct: 100,
              employee_pct: 0,
              created_at: new Date(),
            },
          ],
        }),
      );
      mapper.toGraphQL.mockReturnValue(mockGraphQLSubscription);

      const input: CreateSubscriptionInput = {
        employeeId: 1,
        planId: 1,
        includeSpouse: true,
        numOfChildren: 2,
      };

      await service.createSubscription(input);

      const callArgs = repository.createSubscriptionWithItems.mock.calls[0];
      const items = callArgs[1];

      expect(items).toHaveLength(4);
      expect(items[0]).toMatchObject({
        role: 'employee',
        company_pct: 80,
        employee_pct: 20,
      });
      expect(items[1]).toMatchObject({
        role: 'spouse',
        company_pct: 80, // Uses employee percentage for all family members
        employee_pct: 20,
      });
      expect(items[2]).toMatchObject({
        role: 'child',
        company_pct: 80,
        employee_pct: 20,
      });
    });

    it('should preserve percentages when loading subscription from database', async () => {
      const subscriptionWithCustomPercentages = createMockSubscription({
        items: [
          {
            id: BigInt(1),
            healthcare_subscription_id: BigInt(1),
            role: 'employee' as const,
            demographic_id: BigInt(100),
            company_pct: 95,
            employee_pct: 5,
            created_at: new Date(),
          },
        ],
      });

      repository.findByIdWithRelations.mockResolvedValue(
        subscriptionWithCustomPercentages,
      );

      await service.getSubscriptionStatus('1');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mapper.toGraphQL).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          items: expect.arrayContaining([
            expect.objectContaining({
              company_pct: 95,
              employee_pct: 5,
            }),
          ]),
        }),
      );
    });

    it('should use custom percentages from input instead of plan defaults', async () => {
      // Plan has default percentages
      const planWithDefaults: PlanType = {
        ...mockPlan,
        pct_employee_paid_by_company: new Prisma.Decimal(50),
        pct_spouse_paid_by_company: new Prisma.Decimal(40),
        pct_child_paid_by_company: new Prisma.Decimal(30),
      };

      repository.findEmployeeById.mockResolvedValue(mockEmployee);
      repository.findPlanById.mockResolvedValue(planWithDefaults);
      repository.createSubscriptionWithItems.mockResolvedValue(
        createMockSubscription({
          type: 'family',
          items: [
            {
              id: BigInt(1),
              healthcare_subscription_id: BigInt(1),
              role: 'employee' as const,
              demographic_id: BigInt(100),
              company_pct: 100,
              employee_pct: 0,
              created_at: new Date(),
            },
            {
              id: BigInt(2),
              healthcare_subscription_id: BigInt(1),
              role: 'spouse' as const,
              demographic_id: null,
              company_pct: 75,
              employee_pct: 25,
              created_at: new Date(),
            },
            {
              id: BigInt(3),
              healthcare_subscription_id: BigInt(1),
              role: 'child' as const,
              demographic_id: null,
              company_pct: 90,
              employee_pct: 10,
              created_at: new Date(),
            },
          ],
        }),
      );
      mapper.toGraphQL.mockReturnValue(mockGraphQLSubscription);

      // Input with custom percentages that override plan defaults
      const input: CreateSubscriptionInput = {
        employeeId: 1,
        planId: 1,
        includeSpouse: true,
        numOfChildren: 1,
        employeePercentages: {
          companyPercent: 100, // Override plan's 50%
          employeePercent: 0,
        },
        spousePercentages: {
          companyPercent: 75, // Override plan's 40%
          employeePercent: 25,
        },
        childPercentages: {
          companyPercent: 90, // Override plan's 30%
          employeePercent: 10,
        },
      };

      await service.createSubscription(input);

      // Verify that custom percentages were used, not plan defaults
      const createCall = repository.createSubscriptionWithItems.mock.calls[0];
      expect(createCall[1]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'employee',
            company_pct: 100, // Custom, not plan's 50%
            employee_pct: 0,
          }),
          expect.objectContaining({
            role: 'spouse',
            company_pct: 75, // Custom, not plan's 40%
            employee_pct: 25,
          }),
          expect.objectContaining({
            role: 'child',
            company_pct: 90, // Custom, not plan's 30%
            employee_pct: 10,
          }),
        ]),
      );
    });

    it('should handle 100% company payment for all family members', async () => {
      repository.findEmployeeById.mockResolvedValue(mockEmployee);
      repository.findPlanById.mockResolvedValue({
        ...mockPlan,
        pct_employee_paid_by_company: new Prisma.Decimal(50), // Plan defaults to 50%
        pct_spouse_paid_by_company: new Prisma.Decimal(50),
        pct_child_paid_by_company: new Prisma.Decimal(50),
      });
      repository.createSubscriptionWithItems.mockResolvedValue(
        createMockSubscription({
          type: 'family',
        }),
      );
      mapper.toGraphQL.mockReturnValue(mockGraphQLSubscription);

      const input: CreateSubscriptionInput = {
        employeeId: 1,
        planId: 1,
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
      };

      await service.createSubscription(input);

      // Verify all members have 100% company payment
      const callArgs = repository.createSubscriptionWithItems.mock.calls[0];
      const items = callArgs[1];

      expect(items).toHaveLength(4); // Employee + Spouse + 2 Children
      items.forEach((item) => {
        expect(item.company_pct).toBe(100);
        expect(item.employee_pct).toBe(0);
      });
    });
  });
});
