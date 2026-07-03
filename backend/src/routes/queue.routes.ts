import { Router } from 'express';
import { queueController } from '../controllers/queue.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.post('/', queueController.createQueue);
router.get('/', queueController.listQueues);
router.get('/:id', queueController.getQueueById);
router.put('/:id', queueController.updateQueue);
router.delete('/:id', queueController.deleteQueue);
router.post('/:id/pause', queueController.pauseQueue);
router.post('/:id/resume', queueController.resumeQueue);

export default router;
