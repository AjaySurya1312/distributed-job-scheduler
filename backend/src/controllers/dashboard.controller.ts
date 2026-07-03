import { Request, Response, NextFunction } from 'express';
import { jobService } from '../services/job.service';
import { prisma } from '../config/prisma';

export class DashboardController {
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.query;
      if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
      }
      const stats = await jobService.getDashboardStats(projectId as string);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getWorkersStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.query;
      const queues = await prisma.queue.findMany({ where: { projectId: projectId as string }, select: { id: true } });
      const queueIds = queues.map(q => q.id);
      const activeWorkers = await prisma.worker.count({
        where: {
          queueId: { in: queueIds },
          status: 'IDLE' as any 
        } as any
      });
      res.json({ activeWorkers });
    } catch (error) {
      next(error);
    }
  }

  async getQueueMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { queueId } = req.params;
      const metrics = await jobService.getJobStats(queueId);
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  }

  async getThroughput(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ throughput: 100, unit: 'jobs/min' });
    } catch (error) {
      next(error);
    }
  }

  async getHealth(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'OK', database: 'connected' });
    } catch (error) {
      res.status(500).json({ status: 'ERROR', database: 'disconnected' });
    }
  }
}

export const dashboardController = new DashboardController();
