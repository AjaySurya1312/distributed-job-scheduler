import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/stats', dashboardController.getDashboardStats);
router.get('/workers', dashboardController.getWorkersStats);
router.get('/throughput', dashboardController.getThroughput);
router.get('/health', dashboardController.getHealth);
router.get('/queues/:queueId/metrics', dashboardController.getQueueMetrics);

export default router;
