"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const prisma_1 = require("../config/prisma");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/register', async (req, res, next) => {
    try {
        const { queueId, hostname, status } = req.body;
        const worker = await prisma_1.prisma.worker.create({ data: { queueId, hostname, status } });
        res.status(201).json(worker);
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/heartbeat', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { cpuUsage, memoryUsage } = req.body;
        const heartbeat = await prisma_1.prisma.workerHeartbeat.create({
            data: {
                workerId: id,
                cpuUsage,
                memoryUsage
            }
        });
        res.status(201).json(heartbeat);
    }
    catch (error) {
        next(error);
    }
});
router.get('/', async (req, res, next) => {
    try {
        const { queueId } = req.query;
        const workers = await prisma_1.prisma.worker.findMany({ where: { queueId: queueId } });
        res.json(workers);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=worker.routes.js.map