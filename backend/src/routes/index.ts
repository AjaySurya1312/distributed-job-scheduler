import { Router } from 'express';
import authRoutes from './auth.routes';
import jobRoutes from './job.routes';
import queueRoutes from './queue.routes';
import projectRoutes from './project.routes';
import workerRoutes from './worker.routes';
import dashboardRoutes from './dashboard.routes';
import organizationRoutes from './organization.routes';

/**
 * Main API Router
 * Assembles all feature routers under their respective paths.
 * All routes under this router are prefixed with /api (set in index.ts).
 */
export const router = Router();

// ---- Feature Routers ----
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/projects', projectRoutes);
router.use('/queues', queueRoutes);
router.use('/jobs', jobRoutes);
router.use('/workers', workerRoutes);
router.use('/dashboard', dashboardRoutes);
