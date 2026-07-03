import { Request, Response, NextFunction } from 'express';
import { jobService } from '../services/job.service';

export class JobController {
  async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { queueId } = req.params;
      const job = await jobService.createJob(queueId, req.body);
      res.status(201).json(job);
    } catch (error) {
      next(error);
    }
  }

  async listJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const { queueId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await jobService.listJobs(queueId, page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getJobById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const job = await jobService.getJobById(id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      next(error);
    }
  }

  async cancelJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const job = await jobService.cancelJob(id);
      res.json(job);
    } catch (error) {
      next(error);
    }
  }

  async retryJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const job = await jobService.retryJob(id);
      res.json(job);
    } catch (error) {
      next(error);
    }
  }

  async getJobLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const logs = await jobService.getJobLogs(id);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  }

  async getJobStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { queueId } = req.params;
      const stats = await jobService.getJobStats(queueId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export const jobController = new JobController();
