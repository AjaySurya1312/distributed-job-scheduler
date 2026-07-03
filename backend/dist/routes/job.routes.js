"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const job_controller_1 = require("../controllers/job.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/:queueId/jobs', job_controller_1.jobController.createJob);
router.get('/:queueId/jobs', job_controller_1.jobController.listJobs);
router.get('/:queueId/jobs/stats', job_controller_1.jobController.getJobStats);
router.get('/jobs/:id', job_controller_1.jobController.getJobById);
router.post('/jobs/:id/cancel', job_controller_1.jobController.cancelJob);
router.post('/jobs/:id/retry', job_controller_1.jobController.retryJob);
router.get('/jobs/:id/logs', job_controller_1.jobController.getJobLogs);
exports.default = router;
//# sourceMappingURL=job.routes.js.map