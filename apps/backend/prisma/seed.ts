import { PrismaClient, Prisma, MaritalStatus, ItemRole } from '@prisma/client';
import { dollarsToCents } from '../src/utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'Atlas Healthcare Solutions',
      country_iso_code: 'US',
    },
  });
  console.log(`✅ Created company: ${company.name}`);

  // -------------------- Seed healthcare plans --------------------
  // amounts are in cents, stored as BigInt
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

  // -------------------- Seed employees + wallets --------------------
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
    // Create demographic record
    const demographic = await prisma.demographic.create({
      data: data.demographic,
    });

    // Create employee record linked to demographic and company
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

  // -------------------- Seed healthcare subscriptions with proper costs --------------------
  const basicPlan = await prisma.healthcarePlan.findFirst();
  if (!basicPlan) {
    throw new Error('No healthcare plans found');
  }

  const subscriptionPlans = [
    // Employee 0: John Smith - Family subscription (employee + spouse + 1 child) - ACTIVE
    {
      employeeIndex: 0,
      type: 'family' as const,
      status: 'active' as const,
      items: ['employee', 'spouse', 'child'],
    },
    // Employee 1: Sarah Johnson - Individual subscription - ACTIVE
    {
      employeeIndex: 1,
      type: 'individual' as const,
      status: 'active' as const,
      items: ['employee'],
    },
    // Employee 2: Michael Davis - Individual subscription - ACTIVE
    {
      employeeIndex: 2,
      type: 'individual' as const,
      status: 'active' as const,
      items: ['employee'],
    },
    // Employee 3: Emily Rodriguez - Family subscription - PENDING (for testing workflow)
    {
      employeeIndex: 3,
      type: 'family' as const,
      status: 'demographic_verification_pending' as const,
      items: ['employee', 'spouse'],
    },
    // Employee 4: David Wilson - Individual subscription - PENDING
    {
      employeeIndex: 4,
      type: 'individual' as const,
      status: 'document_upload_pending' as const,
      items: ['employee'],
    },
  ];

  for (const plan of subscriptionPlans) {
    const employeeData = employees[plan.employeeIndex];
    if (!employeeData) {
      throw new Error(`Employee at index ${plan.employeeIndex} not found`);
    }
    const { employee, demographic } = employeeData;

    // Calculate monthly cost for this subscription
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

    // Create subscription
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

    // Create subscription items
    for (const roleString of plan.items) {
      const role = roleString as keyof typeof ItemRole;
      await prisma.healthcareSubscriptionItem.create({
        data: {
          role: ItemRole[role],
          healthcare_subscription_id: subscription.id,
          demographic_id: role === 'employee' ? employee.demographics_id : null,
        },
      });
    }

    // Create wallet with sufficient balance for active subscriptions
    let walletBalance: bigint;
    if (plan.status === 'active') {
      // For active subscriptions, provide 3-6 months of payments
      const monthsOfPayment = 3 + Math.floor(Math.random() * 4); // 3-6 months
      walletBalance = monthlyCost * BigInt(monthsOfPayment);
      console.log(
        `💰 Wallet for ${demographic.first_name} ${demographic.last_name}: $${Number(walletBalance) / 100} (${monthsOfPayment} months of $${Number(monthlyCost) / 100})`,
      );
    } else {
      // For pending subscriptions, provide random amount
      walletBalance = BigInt(Math.floor(Math.random() * dollarsToCents(500))); // $0-$500
    }

    // Create wallet for employee
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
