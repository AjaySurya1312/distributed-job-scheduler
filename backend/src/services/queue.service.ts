import { Queue } from '@prisma/client';
import { queueRepository } from '../repositories/queue.repository';

export class QueueService {
  async createQueue(projectId: string, data: any): Promise<Queue> {
    return queueRepository.createQueue({
      projectId,
      name: data.name,
      concurrency: data.concurrency || 10,
    } as any);
  }

  async listQueues(projectId: string): Promise<Queue[]> {
    return queueRepository.findQueuesByProject(projectId);
  }

  async getQueueById(id: string): Promise<Queue | null> {
    return queueRepository.findQueueById(id);
  }

  async updateQueue(id: string, data: any): Promise<Queue> {
    return queueRepository.updateQueue(id, data);
  }

  async deleteQueue(id: string): Promise<Queue> {
    return queueRepository.deleteQueue(id);
  }

  async pauseQueue(id: string): Promise<Queue> {
    return queueRepository.pauseQueue(id);
  }

  async resumeQueue(id: string): Promise<Queue> {
    return queueRepository.resumeQueue(id);
  }

  async getQueueMetrics(id: string) {
    return queueRepository.getQueueStats(id);
  }
}

export const queueService = new QueueService();
