import { Router } from 'express';
import { queueController } from '../controllers/queue.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate as any);

/**
 * @swagger
 * /api/queues:
 *   post:
 *     summary: Create a new queue
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQueueDto'
 *     responses:
 *       201:
 *         description: Queue created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', queueController.createQueue);
/**
 * @swagger
 * /api/queues:
 *   get:
 *     summary: List all queues
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of queues
 *       401:
 *         description: Unauthorized
 */
router.get('/', queueController.listQueues);
/**
 * @swagger
 * /api/queues/{id}:
 *   get:
 *     summary: Get a queue by ID
 *     tags: [Queues]
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
 *         description: Queue details
 *       404:
 *         description: Queue not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', queueController.getQueueById);
/**
 * @swagger
 * /api/queues/{id}:
 *   put:
 *     summary: Update a queue
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQueueDto'
 *     responses:
 *       200:
 *         description: Queue updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Queue not found
 */
router.put('/:id', queueController.updateQueue);
/**
 * @swagger
 * /api/queues/{id}:
 *   delete:
 *     summary: Delete a queue
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Queue deleted
 *       404:
 *         description: Queue not found
 */
router.delete('/:id', queueController.deleteQueue);
/**
 * @swagger
 * /api/queues/{id}/pause:
 *   post:
 *     summary: Pause a queue
 *     tags: [Queues]
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
 *         description: Queue paused
 *       404:
 *         description: Queue not found
 */
router.post('/:id/pause', queueController.pauseQueue);
/**
 * @swagger
 * /api/queues/{id}/resume:
 *   post:
 *     summary: Resume a paused queue
 *     tags: [Queues]
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
 *         description: Queue resumed
 *       404:
 *         description: Queue not found
 */
router.post('/:id/resume', queueController.resumeQueue);

export default router;
