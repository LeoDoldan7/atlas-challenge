import { PrismaClient } from '@prisma/client';

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

  // Create demographics and employees
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
        marital_status: 'married' as const,
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
        marital_status: 'single' as const,
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
        marital_status: 'divorced' as const,
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
        marital_status: 'married' as const,
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
        marital_status: 'widowed' as const,
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
        balance_cents: Math.floor(Math.random() * 100000), // Random balance between $0-$1000
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
