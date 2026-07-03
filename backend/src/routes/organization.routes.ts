import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';

const router = Router();

router.use(authenticate as any);

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const org = await prisma.organization.create({ data: { name } as any });
    res.status(201).json(org);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await prisma.organization.findMany();
    res.json(orgs);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    const member = await prisma.organizationMember.create({
      data: { organizationId: id, userId, role } as any
    });
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
});

export default router;
