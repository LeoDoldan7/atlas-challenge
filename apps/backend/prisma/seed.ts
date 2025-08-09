import { PrismaClient, Prisma, MaritalStatus } from '@prisma/client';
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

    // Create wallet for employee
    await prisma.wallet.create({
      data: {
        employee_id: employee.id,
        balance_cents: BigInt(Math.floor(Math.random() * dollarsToCents(1000))), // $0–$1,000
        currency_code: 'USD',
      },
    });

    console.log(
      `✅ Created employee: ${data.demographic.first_name} ${data.demographic.last_name}`,
    );
  }

  // -------------------- Seed healthcare subscriptions --------------------
  // Get first plan for testing
  const basicPlan = await prisma.healthcarePlan.findFirst();
  if (!basicPlan) {
    throw new Error('No healthcare plans found');
  }

  // Get first employee for testing
  const firstEmployee = await prisma.employee.findFirst();
  if (!firstEmployee) {
    throw new Error('No employees found');
  }

  // Create a family subscription for the first employee
  const familySubscription = await prisma.healthcareSubscription.create({
    data: {
      employee_id: firstEmployee.id,
      billing_anchor: new Date().getDate(),
      company_id: company.id,
      plan_id: basicPlan.id,
      start_date: new Date(),
      status: 'demographic_verification_pending',
      type: 'family',
    },
  });

  // Create subscription items for family members (employee, spouse, 1 child)
  await prisma.healthcareSubscriptionItem.createMany({
    data: [
      {
        role: 'employee',
        healthcare_subscription_id: familySubscription.id,
        demographic_id: firstEmployee.demographics_id,
      },
      {
        role: 'spouse',
        healthcare_subscription_id: familySubscription.id,
      },
      {
        role: 'child',
        healthcare_subscription_id: familySubscription.id,
      },
    ],
  });

  console.log(`✅ Created family subscription for ${firstEmployee.email}`);
  console.log(
    `📋 Subscription ID: ${familySubscription.id} (status: ${familySubscription.status})`,
  );
  console.log(
    '💡 Use the uploadFamilyDemographics mutation to add spouse and child demographics',
  );

  // -------------------- Create second subscription for file upload testing --------------------
  // Get second employee for testing file upload
  const secondEmployee = await prisma.employee.findFirst({
    where: { id: { not: firstEmployee.id } },
  });

  if (secondEmployee) {
    const fileUploadSubscription = await prisma.healthcareSubscription.create({
      data: {
        employee_id: secondEmployee.id,
        billing_anchor: new Date().getDate(),
        company_id: company.id,
        plan_id: basicPlan.id,
        start_date: new Date(),
        status: 'document_upload_pending',
        type: 'individual',
      },
    });

    // Create subscription item for employee only
    await prisma.healthcareSubscriptionItem.create({
      data: {
        role: 'employee',
        healthcare_subscription_id: fileUploadSubscription.id,
        demographic_id: secondEmployee.demographics_id,
      },
    });

    console.log(
      `✅ Created individual subscription for file upload testing: ${secondEmployee.email}`,
    );
    console.log(
      `📋 Subscription ID: ${fileUploadSubscription.id} (status: ${fileUploadSubscription.status})`,
    );
    console.log('💡 Use the uploadFiles mutation to add documents');
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
