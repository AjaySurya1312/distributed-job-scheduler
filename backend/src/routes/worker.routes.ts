import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';

const router = Router();

router.use(authenticate as any);

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueId, hostname, status } = req.body;
    const worker = await prisma.worker.create({ data: { queueId, hostname, status } as any });
    res.status(201).json(worker);
  } catch (error) {
    next(error);
  }
});

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
