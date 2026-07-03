import { Router } from 'express';
import { jobController } from '../controllers/job.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.post('/:queueId/jobs', jobController.createJob);
router.get('/:queueId/jobs', jobController.listJobs);
router.get('/:queueId/jobs/stats', jobController.getJobStats);
router.get('/jobs/:id', jobController.getJobById);
router.post('/jobs/:id/cancel', jobController.cancelJob);
router.post('/jobs/:id/retry', jobController.retryJob);
router.get('/jobs/:id/logs', jobController.getJobLogs);

export default router;
