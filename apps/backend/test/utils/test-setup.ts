import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { GraphQLResponse } from '../types/graphql.types';

/** Test context with mutable arrays for test data management */
export interface TestContext {
  readonly app: INestApplication;
  readonly prisma: PrismaService;
  companyId: string;
  employeeIds: string[];
  planIds: string[];
  subscriptionIds: string[];
}

/** Employee test data template */
interface EmployeeTestData {
  readonly demographic: {
    readonly first_name: string;
    readonly last_name: string;
    readonly government_id: string;
    readonly birth_date: Date;
  };
  readonly employee: {
    readonly email: string;
    readonly birth_date: Date;
    readonly marital_status:
      | 'married'
      | 'single'
      | 'divorced'
      | 'widowed'
      | 'separated';
  };
}

/** Type-safe GraphQL query function constraints */
type GraphQLQueryVariables = Record<string, unknown> | undefined;

export class TestSetup {
  private static testContext: TestContext;

  static async setup(): Promise<TestContext> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    const prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    TestSetup.testContext = {
      app,
      prisma,
      companyId: '',
      employeeIds: [],
      planIds: [],
      subscriptionIds: [],
    };

    await TestSetup.setupTestData();
    return TestSetup.testContext;
  }

  static async cleanup(): Promise<void> {
    if (!TestSetup.testContext) return;

    await TestSetup.cleanupTestData();
    await TestSetup.testContext.app.close();
  }

  static getContext(): TestContext {
    if (!TestSetup.testContext) {
      throw new Error(
        'Test context not initialized. Call TestSetup.setup() first.',
      );
    }
    return TestSetup.testContext;
  }

  static async setupTestData(): Promise<void> {
    const { prisma } = TestSetup.testContext;

    // Clean existing test data first
    await TestSetup.cleanupTestData();

    // Create company
    const company = await prisma.company.create({
      data: {
        name: `Test Company E2E ${Date.now()}`,
        country_iso_code: 'US',
      },
    });
    TestSetup.testContext.companyId = company.id.toString();

    // Create healthcare plans
    const basicPlan = await prisma.healthcarePlan.create({
      data: {
        name: `E2E Basic Plan ${Date.now()}`,
        cost_employee_cents: BigInt(12000), // $120
        pct_employee_paid_by_company: 0,
        cost_spouse_cents: BigInt(8000), // $80
        pct_spouse_paid_by_company: 0,
        cost_child_cents: BigInt(4000), // $40
        pct_child_paid_by_company: 0,
      },
    });
    TestSetup.testContext.planIds.push(basicPlan.id.toString());

    // Create employees with demographics using type-safe data
    const employeesData: readonly EmployeeTestData[] = [
      {
        demographic: {
          first_name: 'Test',
          last_name: 'Employee1',
          government_id: `SSN-TEST-001-${Date.now()}`,
          birth_date: new Date('1985-01-01'),
        },
        employee: {
          email: `test.employee1.${Date.now()}@test.com`,
          birth_date: new Date('1985-01-01'),
          marital_status: 'married' as const,
        },
      },
      {
        demographic: {
          first_name: 'Test',
          last_name: 'Employee2',
          government_id: `SSN-TEST-002-${Date.now()}`,
          birth_date: new Date('1990-01-01'),
        },
        employee: {
          email: `test.employee2.${Date.now()}@test.com`,
          birth_date: new Date('1990-01-01'),
          marital_status: 'single' as const,
        },
      },
    ] as const;

    for (const data of employeesData) {
      const demographic = await prisma.demographic.create({
        data: data.demographic,
      });

      const employee = await prisma.employee.create({
        data: {
          company_id: company.id,
          demographics_id: demographic.id,
          ...data.employee,
        },
      });

      // Create wallet
      await prisma.wallet.create({
        data: {
          employee_id: employee.id,
          balance_cents: BigInt(50000), // $500
          currency_code: 'USD',
        },
      });

      TestSetup.testContext.employeeIds.push(employee.id.toString());
    }

    // Create initial subscription for document upload
    const documentUploadSubscription =
      await prisma.healthcareSubscription.create({
        data: {
          employee_id: BigInt(TestSetup.testContext.employeeIds[0]),
          company_id: company.id,
          plan_id: basicPlan.id,
          type: 'individual',
          status: 'document_upload_pending',
          start_date: new Date(),
          billing_anchor: 1,
        },
      });
    TestSetup.testContext.subscriptionIds.push(
      documentUploadSubscription.id.toString(),
    );

    // Create subscription item
    await prisma.healthcareSubscriptionItem.create({
      data: {
        healthcare_subscription_id: documentUploadSubscription.id,
        role: 'employee',
        demographic_id: BigInt(TestSetup.testContext.employeeIds[0]),
      },
    });

    // Create a family subscription for demographic upload
    const demographicSubscription = await prisma.healthcareSubscription.create({
      data: {
        employee_id: BigInt(TestSetup.testContext.employeeIds[1]),
        company_id: company.id,
        plan_id: basicPlan.id,
        type: 'family',
        status: 'demographic_verification_pending',
        start_date: new Date(),
        billing_anchor: 1,
      },
    });
    TestSetup.testContext.subscriptionIds.push(
      demographicSubscription.id.toString(),
    );

    // Create subscription items for family (employee + spouse)
    await prisma.healthcareSubscriptionItem.create({
      data: {
        healthcare_subscription_id: demographicSubscription.id,
        role: 'employee',
        demographic_id: BigInt(TestSetup.testContext.employeeIds[1]),
      },
    });

    await prisma.healthcareSubscriptionItem.create({
      data: {
        healthcare_subscription_id: demographicSubscription.id,
        role: 'spouse',
        demographic_id: null, // No demographic yet for spouse
      },
    });
  }

  static async cleanupTestData(): Promise<void> {
    if (!TestSetup.testContext) return;

    const { prisma, employeeIds, subscriptionIds, companyId } =
      TestSetup.testContext;

    try {
      // Delete in reverse dependency order to avoid foreign key constraints
      if (employeeIds.length > 0) {
        await prisma.transaction.deleteMany({
          where: { employee_id: { in: employeeIds.map((id) => BigInt(id)) } },
        });
      }

      if (subscriptionIds.length > 0) {
        await prisma.healthcareSubscriptionFile.deleteMany({
          where: {
            healthcare_subscription_id: {
              in: subscriptionIds.map((id) => BigInt(id)),
            },
          },
        });

        await prisma.healthcareSubscriptionItem.deleteMany({
          where: {
            healthcare_subscription_id: {
              in: subscriptionIds.map((id) => BigInt(id)),
            },
          },
        });
      }

      if (companyId) {
        await prisma.healthcareSubscription.deleteMany({
          where: { company_id: BigInt(companyId) },
        });
      }

      if (employeeIds.length > 0) {
        await prisma.wallet.deleteMany({
          where: { employee_id: { in: employeeIds.map((id) => BigInt(id)) } },
        });

        await prisma.employee.deleteMany({
          where: { id: { in: employeeIds.map((id) => BigInt(id)) } },
        });
      }

      // Clean demographics with test patterns
      await prisma.demographic.deleteMany({
        where: {
          OR: [
            { government_id: { contains: 'SSN-TEST' } },
            { government_id: { contains: 'SSN-FAMILY' } },
            { government_id: { contains: 'SSN-SPOUSE' } },
          ],
        },
      });

      await prisma.healthcarePlan.deleteMany({
        where: { name: { contains: 'E2E' } },
      });

      await prisma.company.deleteMany({
        where: { name: { contains: 'Test Company E2E' } },
      });

      // Reset arrays
      TestSetup.testContext.employeeIds = [];
      TestSetup.testContext.subscriptionIds = [];
      TestSetup.testContext.planIds = [];
      TestSetup.testContext.companyId = '';
    } catch {
      // Silently continue - this is expected on first run
    }
  }

  /**
   * Execute a GraphQL query with type-safe response
   * @param query - GraphQL query string
   * @param variables - Query variables (must be serializable)
   * @returns Promise resolving to typed GraphQL response
   */
  static async graphqlQuery<T = unknown>(
    query: string,
    variables?: GraphQLQueryVariables,
  ): Promise<GraphQLResponse<T>> {
    const { app } = TestSetup.getContext();

    if (variables && typeof variables !== 'object') {
      throw new Error('GraphQL variables must be an object or undefined');
    }

    const rawResponse = await request(app.getHttpServer() as never)
      .post('/graphql')
      .send({ query, variables });

    // Type-safe response construction
    const responseBody = rawResponse.body as
      | {
          data?: T;
          errors?: ReadonlyArray<{
            message: string;
            locations?: ReadonlyArray<{
              line: number;
              column: number;
            }>;
            path?: ReadonlyArray<string | number>;
            extensions?: Record<string, unknown>;
          }>;
        }
      | undefined;

    return {
      status: rawResponse.status,
      body: {
        data: responseBody?.data,
        errors: responseBody?.errors,
      },
    };
  }
}
