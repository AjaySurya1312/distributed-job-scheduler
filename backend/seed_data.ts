import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://jobscheduler:change_me_in_production@localhost:5432/jobscheduler?schema=public"
        }
    }
});

async function main() {
    console.log("Starting massive database seed...");

    // 1. Create User
    const hash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@codity.ai' },
        update: { passwordHash: hash },
        create: {
            email: 'admin@codity.ai',
            passwordHash: hash,
            firstName: 'Admin',
            lastName: 'User'
        }
    });

    // 2. Create Organization
    let org = await prisma.organization.findFirst({ where: { slug: 'codity' } });
    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: 'Codity Organization',
                slug: 'codity'
            }
        });
    }

    // 3. Link user to organization
    const existingMember = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: user.id, organizationId: org.id } }
    });
    if (!existingMember) {
        await prisma.organizationMember.create({
            data: { userId: user.id, organizationId: org.id, role: 'ADMIN' }
        });
    }

    // 4. Create Project
    let project = await prisma.project.findFirst({ where: { slug: 'scheduler-project' } });
    if (!project) {
        project = await prisma.project.create({
            data: {
                name: 'Scheduler Project',
                slug: 'scheduler-project',
                description: 'Main project',
                organizationId: org.id
            }
        });
    }

    // 5. Create Queues
    const queuesToCreate = ['default-queue', 'video-processing-queue', 'email-queue'];
    const queues = [];
    for (const q of queuesToCreate) {
        let queue = await prisma.queue.findFirst({ where: { slug: q } });
        if (!queue) {
            queue = await prisma.queue.create({
                data: {
                    name: q.replace('-', ' '),
                    slug: q,
                    concurrency: 5,
                    isPaused: false,
                    projectId: project.id
                }
            });
        }
        queues.push(queue);
    }

    // 6. Create Active Workers
    const workers = [];
    for (let i = 0; i < 3; i++) {
        const w = await prisma.worker.create({
            data: {
                hostname: `worker-node-${i + 1}`,
                pid: 1000 + i,
                status: 'ACTIVE',
                queueId: queues[0].id,
                lastHeartbeatAt: new Date()
            }
        });
        workers.push(w);
    }

    // 7. Insert 100 random jobs to make dashboard look good
    const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'FAILED', 'RUNNING', 'QUEUED'];
    console.log("Seeding jobs...");
    for (let i = 0; i < 50; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const attempts = status === 'FAILED' ? 3 : status === 'COMPLETED' ? 1 : 0;
        
        await prisma.job.create({
            data: {
                name: `task-${Math.random().toString(36).substring(7)}`,
                payload: { video_id: 12345, resolution: '1080p' },
                status: status as any,
                attempts: attempts,
                queueId: queues[Math.floor(Math.random() * queues.length)].id,
                type: 'IMMEDIATE',
                priority: 10,
                runAt: new Date(Date.now() - Math.random() * 86400000)
            }
        });
    }

    // 8. Add Dead Letter Queue
    const dlqJob = await prisma.job.create({
        data: {
            name: `failing-task-xyz`,
            payload: { email: 'bad@domain.com' },
            status: 'FAILED',
            attempts: 5,
            queueId: queues[0].id,
            type: 'IMMEDIATE'
        }
    });

    await prisma.deadLetterQueue.create({
        data: {
            jobId: dlqJob.id,
            queueId: queues[0].id,
            failureReason: 'SMTP Connection Refused (Max Retries Reached)',
            payloadSnapshot: { email: 'bad@domain.com' },
            totalAttempts: 5
        }
    });

    console.log("Seeding complete! You can now log in with admin@codity.ai / password123");
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
