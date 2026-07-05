import { Router } from 'express';
import { jobController } from '../controllers/job.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate as any);

/**
 * @swagger
 * /api/queues/{queueId}/jobs:
 *   post:
 *     summary: Create a new job in a queue
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJobDto'
 *     responses:
 *       201:
 *         description: Job created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/:queueId/jobs', jobController.createJob);
/**
 * @swagger
 * /api/queues/{queueId}/jobs:
 *   get:
 *     summary: List jobs in a queue
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of jobs
 *       401:
 *         description: Unauthorized
 */
router.get('/:queueId/jobs', jobController.listJobs);
/**
 * @swagger
 * /api/queues/{queueId}/jobs/stats:
 *   get:
 *     summary: Get statistics for jobs in a queue
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/:queueId/jobs/stats', jobController.getJobStats);
/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a job by ID
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */
router.get('/jobs/:id', jobController.getJobById);
/**
 * @swagger
 * /api/jobs/{id}/cancel:
 *   post:
 *     summary: Cancel a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job cancelled
 *       404:
 *         description: Job not found
 *       400:
 *         description: Cannot cancel job
 */
router.post('/jobs/:id/cancel', jobController.cancelJob);
/**
 * @swagger
 * /api/jobs/{id}/retry:
 *   post:
 *     summary: Retry a failed job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job retried
 *       404:
 *         description: Job not found
 *       400:
 *         description: Cannot retry job
 */
router.post('/jobs/:id/retry', jobController.retryJob);
/**
 * @swagger
 * /api/jobs/{id}/logs:
 *   get:
 *     summary: Get logs for a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job logs
 *       404:
 *         description: Job not found
 */
router.get('/jobs/:id/logs', jobController.getJobLogs);

export default router;
