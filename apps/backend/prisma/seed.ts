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
