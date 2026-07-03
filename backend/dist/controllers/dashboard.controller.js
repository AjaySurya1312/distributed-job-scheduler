"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const job_service_1 = require("../services/job.service");
const prisma_1 = require("../config/prisma");
class DashboardController {
    async getDashboardStats(req, res, next) {
        try {
            const { projectId } = req.query;
            if (!projectId) {
                return res.status(400).json({ error: 'projectId is required' });
            }
            const stats = await job_service_1.jobService.getDashboardStats(projectId);
            res.json(stats);
        }
        catch (error) {
            next(error);
        }
    }
    async getWorkersStats(req, res, next) {
        try {
            const { projectId } = req.query;
            const queues = await prisma_1.prisma.queue.findMany({ where: { projectId: projectId }, select: { id: true } });
            const queueIds = queues.map(q => q.id);
            const activeWorkers = await prisma_1.prisma.worker.count({
                where: {
                    queueId: { in: queueIds },
                    status: 'IDLE'
                }
            });
            res.json({ activeWorkers });
        }
        catch (error) {
            next(error);
        }
    }
    async getQueueMetrics(req, res, next) {
        try {
            const { queueId } = req.params;
            const metrics = await job_service_1.jobService.getJobStats(queueId);
            res.json(metrics);
        }
        catch (error) {
            next(error);
        }
    }
    async getThroughput(req, res, next) {
        try {
            res.json({ throughput: 100, unit: 'jobs/min' });
        }
        catch (error) {
            next(error);
        }
    }
    async getHealth(req, res, next) {
        try {
            await prisma_1.prisma.$queryRaw `SELECT 1`;
            res.json({ status: 'OK', database: 'connected' });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', database: 'disconnected' });
        }
    }
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController();
//# sourceMappingURL=dashboard.controller.js.map