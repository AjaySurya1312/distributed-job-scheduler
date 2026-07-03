"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = exports.QueueService = void 0;
const queue_repository_1 = require("../repositories/queue.repository");
class QueueService {
    async createQueue(projectId, data) {
        return queue_repository_1.queueRepository.createQueue({
            projectId,
            name: data.name,
            concurrency: data.concurrency || 10,
        });
    }
    async listQueues(projectId) {
        return queue_repository_1.queueRepository.findQueuesByProject(projectId);
    }
    async getQueueById(id) {
        return queue_repository_1.queueRepository.findQueueById(id);
    }
    async updateQueue(id, data) {
        return queue_repository_1.queueRepository.updateQueue(id, data);
    }
    async deleteQueue(id) {
        return queue_repository_1.queueRepository.deleteQueue(id);
    }
    async pauseQueue(id) {
        return queue_repository_1.queueRepository.pauseQueue(id);
    }
    async resumeQueue(id) {
        return queue_repository_1.queueRepository.resumeQueue(id);
    }
    async getQueueMetrics(id) {
        return queue_repository_1.queueRepository.getQueueStats(id);
    }
}
exports.QueueService = QueueService;
exports.queueService = new QueueService();
//# sourceMappingURL=queue.service.js.map