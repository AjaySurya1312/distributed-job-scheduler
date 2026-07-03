import { Request, Response, NextFunction } from 'express';
import { queueService } from '../services/queue.service';

export class QueueController {
  async createQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.body;
      const queue = await queueService.createQueue(projectId, req.body);
      res.status(201).json(queue);
    } catch (error) {
      next(error);
    }
  }

  async listQueues(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.query;
      const queues = await queueService.listQueues(projectId as string);
      res.json(queues);
    } catch (error) {
      next(error);
    }
  }

  async getQueueById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const queue = await queueService.getQueueById(id);
      if (!queue) {
        return res.status(404).json({ error: 'Queue not found' });
      }
      res.json(queue);
    } catch (error) {
      next(error);
    }
  }

  async updateQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const queue = await queueService.updateQueue(id, req.body);
      res.json(queue);
    } catch (error) {
      next(error);
    }
  }

  async deleteQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await queueService.deleteQueue(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async pauseQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const queue = await queueService.pauseQueue(id);
      res.json(queue);
    } catch (error) {
      next(error);
    }
  }

  async resumeQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const queue = await queueService.resumeQueue(id);
      res.json(queue);
    } catch (error) {
      next(error);
    }
  }
}

export const queueController = new QueueController();
