import { Job, Execution, ExecutionLog } from '@prisma/client';
import { prisma } from '../config/prisma';

export class JobService {
  async createJob(queueId: string, data: any): Promise<Job> {
    return prisma.job.create({
      data: {
        queueId,
        payload: data.payload,
        status: 'PENDING' as any,
        priority: data.priority || 0,
      } as any
    });
  }

  async listJobs(queueId: string, page: number = 1, limit: number = 10): Promise<{ jobs: Job[], total: number }> {
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: { queueId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' } as any
      }),
      prisma.job.count({ where: { queueId } })
    ]);
    return { jobs, total };
  }

  async getJobById(jobId: string): Promise<Job | null> {
    return prisma.job.findUnique({ where: { id: jobId }, include: { executions: true } as any });
  }

  async cancelJob(jobId: string): Promise<Job> {
    return prisma.job.update({
      where: { id: jobId },
      data: { status: 'CANCELLED' as any }
    });
  }

  async retryJob(jobId: string): Promise<Job> {
    return prisma.job.update({
      where: { id: jobId },
      data: { status: 'PENDING' as any, attempts: 0 } as any
    });
  }

  async getJobLogs(jobId: string): Promise<ExecutionLog[]> {
    const executions = await prisma.execution.findMany({
      where: { jobId },
      include: { logs: true } as any,
      orderBy: { createdAt: 'asc' } as any
    });
    return executions.flatMap((exec: any) => exec.logs);
  }

  async getJobStats(queueId: string) {
    const total = await prisma.job.count({ where: { queueId } });
    const pending = await prisma.job.count({ where: { queueId, status: 'PENDING' as any } });
    const completed = await prisma.job.count({ where: { queueId, status: 'COMPLETED' as any } });
    const failed = await prisma.job.count({ where: { queueId, status: 'FAILED' as any } });
    return { total, pending, completed, failed };
  }

  async getDashboardStats(projectId: string) {
    const queues = await prisma.queue.findMany({ where: { projectId }, select: { id: true } });
    const queueIds = queues.map(q => q.id);
    const totalJobs = await prisma.job.count({ where: { queueId: { in: queueIds } } });
    const completedJobs = await prisma.job.count({ where: { queueId: { in: queueIds }, status: 'COMPLETED' as any } });
    const failedJobs = await prisma.job.count({ where: { queueId: { in: queueIds }, status: 'FAILED' as any } });
    
    return { totalJobs, completedJobs, failedJobs };
  }
}

export const jobService = new JobService();
