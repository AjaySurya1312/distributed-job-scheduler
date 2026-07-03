import { Prisma, Queue } from '@prisma/client';
import { prisma } from '../config/prisma';

export class QueueRepository {
  async createQueue(data: Prisma.QueueUncheckedCreateInput): Promise<Queue> {
    return prisma.queue.create({ data });
  }

  async findQueueById(id: string): Promise<Queue | null> {
    return prisma.queue.findUnique({ where: { id } });
  }

  async findQueuesByProject(projectId: string): Promise<Queue[]> {
    return prisma.queue.findMany({ where: { projectId } });
  }

  async updateQueue(id: string, data: Prisma.QueueUpdateInput): Promise<Queue> {
    return prisma.queue.update({ where: { id }, data });
  }

  async deleteQueue(id: string): Promise<Queue> {
    return prisma.queue.update({
      where: { id },
      data: { status: 'DELETED' } as any
    });
  }

  async pauseQueue(id: string): Promise<Queue> {
    return prisma.queue.update({
      where: { id },
      data: { status: 'PAUSED' } as any
    });
  }

  async resumeQueue(id: string): Promise<Queue> {
    return prisma.queue.update({
      where: { id },
      data: { status: 'ACTIVE' } as any
    });
  }

  async getQueueStats(id: string) {
    const totalJobs = await prisma.job.count({ where: { queueId: id } });
    const pendingJobs = await prisma.job.count({ where: { queueId: id, status: 'PENDING' as any } });
    const processingJobs = await prisma.job.count({ where: { queueId: id, status: 'PROCESSING' as any } });
    const completedJobs = await prisma.job.count({ where: { queueId: id, status: 'COMPLETED' as any } });
    const failedJobs = await prisma.job.count({ where: { queueId: id, status: 'FAILED' as any } });
    
    return {
      totalJobs,
      pendingJobs,
      processingJobs,
      completedJobs,
      failedJobs
    };
  }

  async findQueueByProjectAndSlug(projectId: string, slug: string): Promise<Queue | null> {
    return prisma.queue.findFirst({
      where: { projectId, name: slug } as any
    });
  }
}

export const queueRepository = new QueueRepository();
