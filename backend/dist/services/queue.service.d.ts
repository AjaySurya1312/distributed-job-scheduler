import { Queue } from '@prisma/client';
export declare class QueueService {
    createQueue(projectId: string, data: any): Promise<Queue>;
    listQueues(projectId: string): Promise<Queue[]>;
    getQueueById(id: string): Promise<Queue | null>;
    updateQueue(id: string, data: any): Promise<Queue>;
    deleteQueue(id: string): Promise<Queue>;
    pauseQueue(id: string): Promise<Queue>;
    resumeQueue(id: string): Promise<Queue>;
    getQueueMetrics(id: string): Promise<{
        totalJobs: number;
        pendingJobs: number;
        processingJobs: number;
        completedJobs: number;
        failedJobs: number;
    }>;
}
export declare const queueService: QueueService;
//# sourceMappingURL=queue.service.d.ts.map