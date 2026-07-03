"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/stats', dashboard_controller_1.dashboardController.getDashboardStats);
router.get('/workers', dashboard_controller_1.dashboardController.getWorkersStats);
router.get('/throughput', dashboard_controller_1.dashboardController.getThroughput);
router.get('/health', dashboard_controller_1.dashboardController.getHealth);
router.get('/queues/:queueId/metrics', dashboard_controller_1.dashboardController.getQueueMetrics);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map