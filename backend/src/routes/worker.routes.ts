import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';

const router = Router();

router.use(authenticate as any);

/**
 * @swagger
 * /api/workers/register:
 *   post:
 *     summary: Register a new worker
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               queueId:
 *                 type: string
 *               hostname:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Worker registered
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueId, hostname, status } = req.body;
    const worker = await prisma.worker.create({ data: { queueId, hostname, status } as any });
    res.status(201).json(worker);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/workers/{id}/heartbeat:
 *   post:
 *     summary: Record worker heartbeat
 *     tags: [Workers]
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
 *             type: object
 *             properties:
 *               cpuUsage:
 *                 type: number
 *               memoryUsage:
 *                 type: number
 *     responses:
 *       201:
 *         description: Heartbeat recorded
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/heartbeat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { cpuUsage, memoryUsage } = req.body;
    const heartbeat = await prisma.workerHeartbeat.create({
      data: {
        workerId: id,
        cpuUsage,
        memoryUsage
      } as any
    });
    res.status(201).json(heartbeat);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/workers:
 *   get:
 *     summary: List all workers
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: queueId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of workers
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueId } = req.query;
    const workers = await prisma.worker.findMany({ where: { queueId: queueId as string } });
    res.json(workers);
  } catch (error) {
    next(error);
  }
});

export default router;
