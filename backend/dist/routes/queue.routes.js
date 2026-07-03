"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const queue_controller_1 = require("../controllers/queue.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', queue_controller_1.queueController.createQueue);
router.get('/', queue_controller_1.queueController.listQueues);
router.get('/:id', queue_controller_1.queueController.getQueueById);
router.put('/:id', queue_controller_1.queueController.updateQueue);
router.delete('/:id', queue_controller_1.queueController.deleteQueue);
router.post('/:id/pause', queue_controller_1.queueController.pauseQueue);
router.post('/:id/resume', queue_controller_1.queueController.resumeQueue);
exports.default = router;
//# sourceMappingURL=queue.routes.js.map