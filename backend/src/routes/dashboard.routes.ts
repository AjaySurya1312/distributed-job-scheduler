import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate as any);

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', dashboardController.getDashboardStats);
/**
 * @swagger
 * /api/dashboard/workers:
 *   get:
 *     summary: Get worker statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Worker stats
 *       401:
 *         description: Unauthorized
 */
router.get('/workers', dashboardController.getWorkersStats);
/**
 * @swagger
 * /api/dashboard/throughput:
 *   get:
 *     summary: Get system throughput metrics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Throughput metrics
 *       401:
 *         description: Unauthorized
 */
router.get('/throughput', dashboardController.getThroughput);
/**
 * @swagger
 * /api/dashboard/health:
 *   get:
 *     summary: Get system health status
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health status
 *       401:
 *         description: Unauthorized
 */
router.get('/health', dashboardController.getHealth);
/**
 * @swagger
 * /api/dashboard/queues/{queueId}/metrics:
 *   get:
 *     summary: Get metrics for a specific queue
 *     tags: [Dashboard]
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
 *         description: Queue metrics
 *       401:
 *         description: Unauthorized
 */
router.get('/queues/:queueId/metrics', dashboardController.getQueueMetrics);

export default router;
