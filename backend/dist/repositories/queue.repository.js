"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueRepository = exports.QueueRepository = void 0;
const prisma_1 = require("../config/prisma");
class QueueRepository {
    async createQueue(data) {
        return prisma_1.prisma.queue.create({ data });
    }
    async findQueueById(id) {
        return prisma_1.prisma.queue.findUnique({ where: { id } });
    }
    async findQueuesByProject(projectId) {
        return prisma_1.prisma.queue.findMany({ where: { projectId } });
    }
    async updateQueue(id, data) {
        return prisma_1.prisma.queue.update({ where: { id }, data });
    }
    async deleteQueue(id) {
        return prisma_1.prisma.queue.update({
            where: { id },
            data: { status: 'DELETED' }
        });
    }
    async pauseQueue(id) {
        return prisma_1.prisma.queue.update({
            where: { id },
            data: { status: 'PAUSED' }
        });
    }
    async resumeQueue(id) {
        return prisma_1.prisma.queue.update({
            where: { id },
            data: { status: 'ACTIVE' }
        });
    }
    async getQueueStats(id) {
        const totalJobs = await prisma_1.prisma.job.count({ where: { queueId: id } });
        const pendingJobs = await prisma_1.prisma.job.count({ where: { queueId: id, status: 'PENDING' } });
        const processingJobs = await prisma_1.prisma.job.count({ where: { queueId: id, status: 'PROCESSING' } });
        const completedJobs = await prisma_1.prisma.job.count({ where: { queueId: id, status: 'COMPLETED' } });
        const failedJobs = await prisma_1.prisma.job.count({ where: { queueId: id, status: 'FAILED' } });
        return {
            totalJobs,
            pendingJobs,
            processingJobs,
            completedJobs,
            failedJobs
        };
    }
    async findQueueByProjectAndSlug(projectId, slug) {
        return prisma_1.prisma.queue.findFirst({
            where: { projectId, name: slug }
        });
    }
}
exports.QueueRepository = QueueRepository;
exports.queueRepository = new QueueRepository();
//# sourceMappingURL=queue.repository.js.map