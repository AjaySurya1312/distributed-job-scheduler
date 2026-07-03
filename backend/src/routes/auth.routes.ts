import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authenticate as any, authController.me);
router.post('/api-keys', authenticate as any, authController.createApiKey);
router.delete('/api-keys/:id', authenticate as any, authController.revokeApiKey);

export default router;
