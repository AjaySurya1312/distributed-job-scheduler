import { Prisma, Queue } from '@prisma/client';
export declare class QueueRepository {
    createQueue(data: Prisma.QueueUncheckedCreateInput): Promise<Queue>;
    findQueueById(id: string): Promise<Queue | null>;
    findQueuesByProject(projectId: string): Promise<Queue[]>;
    updateQueue(id: string, data: Prisma.QueueUpdateInput): Promise<Queue>;
    deleteQueue(id: string): Promise<Queue>;
    pauseQueue(id: string): Promise<Queue>;
    resumeQueue(id: string): Promise<Queue>;
    getQueueStats(id: string): Promise<{
        totalJobs: number;
        pendingJobs: number;
        processingJobs: number;
        completedJobs: number;
        failedJobs: number;
    }>;
    findQueueByProjectAndSlug(projectId: string, slug: string): Promise<Queue | null>;
}
export declare const queueRepository: QueueRepository;
//# sourceMappingURL=queue.repository.d.ts.map