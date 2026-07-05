import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed() {
  console.log('Seeding database...');

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
    },
  });

  // 2. Create User and Member
  const user = await prisma.user.create({
    data: {
      email: 'admin@acmecorp.com',
      passwordHash: '$2b$10$EP4.o8pC/Z9U3m2H.3X3u.f.P./8g/85xH79Wz2/Z8f29t36b9MOW', // Placeholder hash
      firstName: 'Admin',
      lastName: 'User',
      memberships: {
        create: {
          organizationId: org.id,
          role: 'ADMIN',
        },
      },
    },
  });

  // 3. Create Project
  const project = await prisma.project.create({
    data: {
      name: 'E-commerce Backend',
      slug: 'ecommerce-backend',
      description: 'Main production jobs for e-commerce',
      organizationId: org.id,
    },
  });

  // 4. Create Queue
  const queue = await prisma.queue.create({
    data: {
      name: 'email-notifications',
      slug: 'email-notifications',
      concurrency: 5,
      isPaused: false,
      projectId: project.id,
    },
  });

  // 5. Create Jobs
  const job1 = await prisma.job.create({
    data: {
      name: 'send-welcome-email',
      payload: { userId: '12345', template: 'welcome_v2' },
      status: 'COMPLETED',
      attempts: 1,
      queueId: queue.id,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      name: 'send-invoice-email',
      payload: { invoiceId: 'INV-999', amount: 50.00 },
      status: 'FAILED',
      attempts: 3,
      queueId: queue.id,
    },
  });

  // 6. Create Retry Policy
  await prisma.retryPolicy.create({
    data: {
      organizationId: org.id,
      name: 'Default Exponential',
      strategy: 'EXPONENTIAL',
      maxAttempts: 3,
      baseDelayMs: 1000,
    },
  });

  // 7. Create Worker
  const worker = await prisma.worker.create({
    data: {
      hostname: 'worker-node-01',
      pid: 1234,
      status: 'ACTIVE',
      queueId: queue.id,
    },
  });

  // 8. Create Executions
  await prisma.execution.create({
    data: {
      status: 'COMPLETED',
      durationMs: 450,
      jobId: job1.id,
      workerId: worker.id,
      attemptNumber: 1,
    },
  });

  await prisma.execution.create({
    data: {
      status: 'FAILED',
      errorMessage: 'SMTP Connection Timeout',
      durationMs: 5000,
      jobId: job2.id,
      workerId: worker.id,
      attemptNumber: 1,
    },
  });

  console.log('Seeding complete.');
}

export async function main() {
  try {
    await seed();
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error during seeding:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
