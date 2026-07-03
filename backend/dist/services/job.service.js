"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobService = exports.JobService = void 0;
const prisma_1 = require("../config/prisma");
class JobService {
    async createJob(queueId, data) {
        return prisma_1.prisma.job.create({
            data: {
                queueId,
                payload: data.payload,
                status: 'PENDING',
                priority: data.priority || 0,
            }
        });
    }
    async listJobs(queueId, page = 1, limit = 10) {
        const [jobs, total] = await Promise.all([
            prisma_1.prisma.job.findMany({
                where: { queueId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.prisma.job.count({ where: { queueId } })
        ]);
        return { jobs, total };
    }
    async getJobById(jobId) {
        return prisma_1.prisma.job.findUnique({ where: { id: jobId }, include: { executions: true } });
    }
    async cancelJob(jobId) {
        return prisma_1.prisma.job.update({
            where: { id: jobId },
            data: { status: 'CANCELLED' }
        });
    }
    async retryJob(jobId) {
        return prisma_1.prisma.job.update({
            where: { id: jobId },
            data: { status: 'PENDING', attempts: 0 }
        });
    }
    async getJobLogs(jobId) {
        const executions = await prisma_1.prisma.execution.findMany({
            where: { jobId },
            include: { logs: true },
            orderBy: { createdAt: 'asc' }
        });
        return executions.flatMap((exec) => exec.logs);
    }
    async getJobStats(queueId) {
        const total = await prisma_1.prisma.job.count({ where: { queueId } });
        const pending = await prisma_1.prisma.job.count({ where: { queueId, status: 'PENDING' } });
        const completed = await prisma_1.prisma.job.count({ where: { queueId, status: 'COMPLETED' } });
        const failed = await prisma_1.prisma.job.count({ where: { queueId, status: 'FAILED' } });
        return { total, pending, completed, failed };
    }
    async getDashboardStats(projectId) {
        const queues = await prisma_1.prisma.queue.findMany({ where: { projectId }, select: { id: true } });
        const queueIds = queues.map(q => q.id);
        const totalJobs = await prisma_1.prisma.job.count({ where: { queueId: { in: queueIds } } });
        const completedJobs = await prisma_1.prisma.job.count({ where: { queueId: { in: queueIds }, status: 'COMPLETED' } });
        const failedJobs = await prisma_1.prisma.job.count({ where: { queueId: { in: queueIds }, status: 'FAILED' } });
        return { totalJobs, completedJobs, failedJobs };
    }
}
exports.JobService = JobService;
exports.jobService = new JobService();
//# sourceMappingURL=job.service.js.map