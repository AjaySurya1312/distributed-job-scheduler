import { Job, ExecutionLog } from '@prisma/client';
export declare class JobService {
    createJob(queueId: string, data: any): Promise<Job>;
    listJobs(queueId: string, page?: number, limit?: number): Promise<{
        jobs: Job[];
        total: number;
    }>;
    getJobById(jobId: string): Promise<Job | null>;
    cancelJob(jobId: string): Promise<Job>;
    retryJob(jobId: string): Promise<Job>;
    getJobLogs(jobId: string): Promise<ExecutionLog[]>;
    getJobStats(queueId: string): Promise<{
        total: number;
        pending: number;
        completed: number;
        failed: number;
    }>;
    getDashboardStats(projectId: string): Promise<{
        totalJobs: number;
        completedJobs: number;
        failedJobs: number;
    }>;
}
export declare const jobService: JobService;
//# sourceMappingURL=job.service.d.ts.map