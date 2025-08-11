import {
  PrismaClient,
  Prisma,
  MaritalStatus,
  ItemRole,
  SubscriptionStatus,
} from '@prisma/client';
import { dollarsToCents } from '../src/utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const company = await prisma.company.create({
    data: {
      name: 'Atlas Healthcare Solutions',
      country_iso_code: 'US',
    },
  });
  console.log(`✅ Created company: ${company.name}`);

  const plans = [
    {
      name: 'Basic Health Plan',
      employeeCents: dollarsToCents(120),
      spouseCents: dollarsToCents(80),
      childCents: dollarsToCents(40),
    },
    {
      name: 'Premium Health Plan',
      employeeCents: dollarsToCents(200),
      spouseCents: dollarsToCents(120),
      childCents: dollarsToCents(60),
    },
    {
      name: 'Dental Add-on',
      employeeCents: dollarsToCents(25),
      spouseCents: dollarsToCents(20),
      childCents: dollarsToCents(15),
    },
  ];

  for (const p of plans) {
    await prisma.healthcarePlan.create({
      data: {
        name: p.name,
        cost_employee_cents: BigInt(p.employeeCents),
        pct_employee_paid_by_company: new Prisma.Decimal(0),
        cost_spouse_cents: BigInt(p.spouseCents),
        pct_spouse_paid_by_company: new Prisma.Decimal(0),
        cost_child_cents: BigInt(p.childCents),
        pct_child_paid_by_company: new Prisma.Decimal(0),
      },
    });
    console.log(`✅ Created plan: ${p.name}`);
  }

  const employeesData = [
    {
      demographic: {
        first_name: 'John',
        last_name: 'Smith',
        government_id: 'SSN-123456789',
        birth_date: new Date('1985-03-15'),
      },
      employee: {
        email: 'john.smith@atlas.com',
        birth_date: new Date('1985-03-15'),
        marital_status: MaritalStatus.married,
      },
    },
    {
      demographic: {
        first_name: 'Sarah',
        last_name: 'Johnson',
        government_id: 'SSN-987654321',
        birth_date: new Date('1990-07-22'),
      },
      employee: {
        email: 'sarah.johnson@atlas.com',
        birth_date: new Date('1990-07-22'),
        marital_status: MaritalStatus.single,
      },
    },
    {
      demographic: {
        first_name: 'Michael',
        last_name: 'Davis',
        government_id: 'SSN-456789123',
        birth_date: new Date('1982-11-08'),
      },
      employee: {
        email: 'michael.davis@atlas.com',
        birth_date: new Date('1982-11-08'),
        marital_status: MaritalStatus.divorced,
      },
    },
    {
      demographic: {
        first_name: 'Emily',
        last_name: 'Rodriguez',
        government_id: 'SSN-789123456',
        birth_date: new Date('1988-05-30'),
      },
      employee: {
        email: 'emily.rodriguez@atlas.com',
        birth_date: new Date('1988-05-30'),
        marital_status: MaritalStatus.married,
      },
    },
    {
      demographic: {
        first_name: 'David',
        last_name: 'Wilson',
        government_id: 'SSN-321654987',
        birth_date: new Date('1975-12-03'),
      },
      employee: {
        email: 'david.wilson@atlas.com',
        birth_date: new Date('1975-12-03'),
        marital_status: MaritalStatus.widowed,
      },
    },
  ];

  interface EmployeeWithDemographic {
    employee: {
      id: bigint;
      demographics_id: bigint;
      [key: string]: unknown;
    };
    demographic: {
      first_name: string;
      last_name: string;
      [key: string]: unknown;
    };
  }

  const employees: EmployeeWithDemographic[] = [];
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

    employees.push({ employee, demographic });
    console.log(
      `✅ Created employee: ${data.demographic.first_name} ${data.demographic.last_name}`,
    );
  }

  const basicPlan = await prisma.healthcarePlan.findFirst();
  if (!basicPlan) {
    throw new Error('No healthcare plans found');
  }

  const subscriptionPlans = [
    {
      employeeIndex: 0,
      type: 'family' as const,
      status: SubscriptionStatus.ACTIVE,
      items: ['employee', 'spouse', 'child'],
    },
    {
      employeeIndex: 1,
      type: 'individual' as const,
      status: SubscriptionStatus.ACTIVE,
      items: ['employee'],
    },
    {
      employeeIndex: 2,
      type: 'individual' as const,
      status: SubscriptionStatus.ACTIVE,
      items: ['employee'],
    },
    {
      employeeIndex: 3,
      type: 'family' as const,
      status: SubscriptionStatus.PENDING,
      items: ['employee', 'spouse'],
    },
    {
      employeeIndex: 4,
      type: 'individual' as const,
      status: SubscriptionStatus.PENDING,
      items: ['employee'],
    },
  ];

  for (const plan of subscriptionPlans) {
    const employeeData = employees[plan.employeeIndex];
    if (!employeeData) {
      throw new Error(`Employee at index ${plan.employeeIndex} not found`);
    }
    const { employee, demographic } = employeeData;

    let monthlyCost = BigInt(0);
    for (const roleString of plan.items) {
      switch (roleString) {
        case 'employee':
          monthlyCost += basicPlan.cost_employee_cents;
          break;
        case 'spouse':
          monthlyCost += basicPlan.cost_spouse_cents;
          break;
        case 'child':
          monthlyCost += basicPlan.cost_child_cents;
          break;
      }
    }

    const subscription = await prisma.healthcareSubscription.create({
      data: {
        employee_id: employee.id,
        billing_anchor: new Date().getDate(),
        company_id: company.id,
        plan_id: basicPlan.id,
        start_date: new Date(),
        status: plan.status,
        type: plan.type,
      },
    });

    for (const roleString of plan.items) {
      const role = roleString as keyof typeof ItemRole;
      // Set different percentages for different subscriptions for testing
      const companyPct = plan.status === SubscriptionStatus.ACTIVE ? 75 : 50;
      const employeePct = 100 - companyPct;
      
      await prisma.healthcareSubscriptionItem.create({
        data: {
          role: ItemRole[role],
          healthcare_subscription_id: subscription.id,
          demographic_id: role === 'employee' ? employee.demographics_id : null,
          company_pct: companyPct,
          employee_pct: employeePct,
        },
      });
    }

    // Create enrollment steps for PENDING subscriptions
    if (plan.status === SubscriptionStatus.PENDING) {
      await prisma.subscriptionStep.createMany({
        data: [
          {
            healthcare_subscription_id: subscription.id,
            type: 'DEMOGRAPHIC_VERIFICATION',
            status: 'PENDING',
          },
          {
            healthcare_subscription_id: subscription.id,
            type: 'DOCUMENT_UPLOAD',
            status: 'PENDING',
          },
          {
            healthcare_subscription_id: subscription.id,
            type: 'PLAN_ACTIVATION',
            status: 'PENDING',
          },
        ],
      });
    }

    let walletBalance: bigint;
    if (plan.status === SubscriptionStatus.ACTIVE) {
      const monthsOfPayment = 3 + Math.floor(Math.random() * 4); // 3-6 months
      walletBalance = monthlyCost * BigInt(monthsOfPayment);
      console.log(
        `💰 Wallet for ${demographic.first_name} ${demographic.last_name}: $${Number(walletBalance) / 100} (${monthsOfPayment} months of $${Number(monthlyCost) / 100})`,
      );
    } else {
      walletBalance = BigInt(Math.floor(Math.random() * dollarsToCents(500))); // $0-$500
    }

    await prisma.wallet.create({
      data: {
        employee_id: employee.id,
        balance_cents: walletBalance,
        currency_code: 'USD',
      },
    });

    console.log(
      `✅ Created ${plan.type} subscription for ${demographic.first_name} ${demographic.last_name} (${plan.status})`,
    );
  }

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e: unknown) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
