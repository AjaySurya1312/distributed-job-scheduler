import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';

const router = Router();

router.use(authenticate as any);

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Create a new organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organization created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const org = await prisma.organization.create({ data: { name } as any });
    res.status(201).json(org);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: List all organizations
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of organizations
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await prisma.organization.findMany();
    res.json(orgs);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/organizations/{id}/members:
 *   post:
 *     summary: Add a member to an organization
 *     tags: [Organizations]
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
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Member added
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
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
