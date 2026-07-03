import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const user = await authService.me(userId);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async createApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const { projectId, name } = req.body;
      const apiKey = await authService.createApiKey(userId, projectId, name);
      res.status(201).json(apiKey);
    } catch (error) {
      next(error);
    }
  }

  async revokeApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await authService.revokeApiKey(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
