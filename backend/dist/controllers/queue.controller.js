"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueController = exports.QueueController = void 0;
const queue_service_1 = require("../services/queue.service");
class QueueController {
    async createQueue(req, res, next) {
        try {
            const { projectId } = req.body;
            const queue = await queue_service_1.queueService.createQueue(projectId, req.body);
            res.status(201).json(queue);
        }
        catch (error) {
            next(error);
        }
    }
    async listQueues(req, res, next) {
        try {
            const { projectId } = req.query;
            const queues = await queue_service_1.queueService.listQueues(projectId);
            res.json(queues);
        }
        catch (error) {
            next(error);
        }
    }
    async getQueueById(req, res, next) {
        try {
            const { id } = req.params;
            const queue = await queue_service_1.queueService.getQueueById(id);
            if (!queue) {
                return res.status(404).json({ error: 'Queue not found' });
            }
            res.json(queue);
        }
        catch (error) {
            next(error);
        }
    }
    async updateQueue(req, res, next) {
        try {
            const { id } = req.params;
            const queue = await queue_service_1.queueService.updateQueue(id, req.body);
            res.json(queue);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteQueue(req, res, next) {
        try {
            const { id } = req.params;
            await queue_service_1.queueService.deleteQueue(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async pauseQueue(req, res, next) {
        try {
            const { id } = req.params;
            const queue = await queue_service_1.queueService.pauseQueue(id);
            res.json(queue);
        }
        catch (error) {
            next(error);
        }
    }
    async resumeQueue(req, res, next) {
        try {
            const { id } = req.params;
            const queue = await queue_service_1.queueService.resumeQueue(id);
            res.json(queue);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.QueueController = QueueController;
exports.queueController = new QueueController();
//# sourceMappingURL=queue.controller.js.map