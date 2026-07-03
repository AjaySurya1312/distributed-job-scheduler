import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';

const router = Router();

router.use(authenticate as any);

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, organizationId } = req.body;
    const project = await prisma.project.create({ data: { name, organizationId } as any });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await prisma.project.findMany();
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (error) {
    next(error);
  }
});

export default router;
