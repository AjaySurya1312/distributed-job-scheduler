"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobController = exports.JobController = void 0;
const job_service_1 = require("../services/job.service");
class JobController {
    async createJob(req, res, next) {
        try {
            const { queueId } = req.params;
            const job = await job_service_1.jobService.createJob(queueId, req.body);
            res.status(201).json(job);
        }
        catch (error) {
            next(error);
        }
    }
    async listJobs(req, res, next) {
        try {
            const { queueId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await job_service_1.jobService.listJobs(queueId, page, limit);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getJobById(req, res, next) {
        try {
            const { id } = req.params;
            const job = await job_service_1.jobService.getJobById(id);
            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }
            res.json(job);
        }
        catch (error) {
            next(error);
        }
    }
    async cancelJob(req, res, next) {
        try {
            const { id } = req.params;
            const job = await job_service_1.jobService.cancelJob(id);
            res.json(job);
        }
        catch (error) {
            next(error);
        }
    }
    async retryJob(req, res, next) {
        try {
            const { id } = req.params;
            const job = await job_service_1.jobService.retryJob(id);
            res.json(job);
        }
        catch (error) {
            next(error);
        }
    }
    async getJobLogs(req, res, next) {
        try {
            const { id } = req.params;
            const logs = await job_service_1.jobService.getJobLogs(id);
            res.json(logs);
        }
        catch (error) {
            next(error);
        }
    }
    async getJobStats(req, res, next) {
        try {
            const { queueId } = req.params;
            const stats = await job_service_1.jobService.getJobStats(queueId);
            res.json(stats);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.JobController = JobController;
exports.jobController = new JobController();
//# sourceMappingURL=job.controller.js.map