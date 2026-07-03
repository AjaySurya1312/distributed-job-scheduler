"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_routes_1 = require("./auth.routes");
const job_routes_1 = require("./job.routes");
const queue_routes_1 = require("./queue.routes");
const project_routes_1 = require("./project.routes");
const worker_routes_1 = require("./worker.routes");
const dashboard_routes_1 = require("./dashboard.routes");
const organization_routes_1 = require("./organization.routes");
/**
 * Main API Router
 * Assembles all feature routers under their respective paths.
 * All routes under this router are prefixed with /api (set in index.ts).
 */
exports.router = (0, express_1.Router)();
// ---- Feature Routers ----
exports.router.use('/auth', auth_routes_1.authRoutes);
exports.router.use('/organizations', organization_routes_1.organizationRoutes);
exports.router.use('/projects', project_routes_1.projectRoutes);
exports.router.use('/queues', queue_routes_1.queueRoutes);
exports.router.use('/jobs', job_routes_1.jobRoutes);
exports.router.use('/workers', worker_routes_1.workerRoutes);
exports.router.use('/dashboard', dashboard_routes_1.dashboardRoutes);
//# sourceMappingURL=index.js.map