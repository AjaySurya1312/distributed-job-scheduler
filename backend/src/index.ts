import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './config/logger';
import { redisClient as redis } from './config/redis';
import { prisma } from './config/prisma';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { defaultLimiter } from './middlewares/rate-limit.middleware';
import { swaggerSpec } from './config/swagger';
import { router } from './routes';

// ============================================================
// Application Factory
// ============================================================
function createApp(): Application {
  const app = express();

  // ---- Trust proxy (for rate limiting behind Nginx) ----
  app.set('trust proxy', 1);

  // ---- Security headers (must be first) ----
  app.use(helmet({
    contentSecurityPolicy: false, // Allow Swagger UI
    crossOriginEmbedderPolicy: false,
  }));

  // ---- CORS ----
  const allowedOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-Total-Count'],
  }));

  // ---- Body parsing ----
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ---- Request ID (must be before logger) ----
  app.use(requestIdMiddleware);

  // ---- HTTP request logging ----
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.http(message.trim()),
      },
    }));
  }

  // ---- Global rate limiting ----
  app.use('/api', defaultLimiter);

  // ---- API Documentation ----
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Job Scheduler API Docs',
  }));

  // ---- Health check (unauthenticated) ----
  app.get('/api/health', async (_req: Request, res: Response) => {
    try {
      // Check PostgreSQL
      await prisma.$queryRaw`SELECT 1`;
      // Check Redis
      await redis.ping();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          postgres: 'connected',
          redis: 'connected',
        },
        version: process.env.npm_package_version ?? '1.0.0',
        uptime: process.uptime(),
      });
    } catch (err) {
      logger.error('Health check failed', { error: err });
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  // ---- API Routes ----
  app.use('/api', router);

  // ---- 404 handler ----
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist',
      },
    });
  });

  // ---- Global error handler (must be last) ----
  app.use(errorHandler);

  return app;
}

// ============================================================
// WebSocket Server Setup
// ============================================================
function setupWebSocket(server: http.Server): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGINS.split(',').map(o => o.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.debug(`WebSocket client connected: ${socket.id}`);

    // Client subscribes to their org's events
    socket.on('subscribe', (orgId: string) => {
      if (orgId && typeof orgId === 'string') {
        socket.join(`org:${orgId}`);
        logger.debug(`Socket ${socket.id} subscribed to org:${orgId}`);
      }
    });

    socket.on('unsubscribe', (orgId: string) => {
      socket.leave(`org:${orgId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`WebSocket client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  // Subscribe to Redis PubSub channels and broadcast to connected clients
  const subscriber = redis.duplicate();

  subscriber.subscribe('job-events', 'worker-events', 'metrics-stream', (err: any, count: any) => {
    if (err) {
      logger.error('Redis PubSub subscription error', { error: err });
      return;
    }
    logger.info(`Subscribed to ${count} Redis PubSub channels`);
  });

  subscriber.on('message', (channel: string, message: string) => {
    try {
      const payload = JSON.parse(message) as { orgId?: string; type: string };
      if (payload.orgId) {
        // Broadcast to org-specific room
        io.to(`org:${payload.orgId}`).emit('event', {
          channel,
          ...payload,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Broadcast to all connected clients
        io.emit('event', {
          channel,
          ...payload,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      logger.warn('Failed to parse Redis PubSub message', { channel, message });
    }
  });

  return io;
}

// ============================================================
// Graceful Shutdown
// ============================================================
function setupGracefulShutdown(server: http.Server): void {
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async (err) => {
      if (err) {
        logger.error('Error closing HTTP server', { error: err });
      }

      try {
        // Close database connection
        await prisma.$disconnect();
        logger.info('PostgreSQL disconnected');

        // Close Redis connection
        await redis.quit();
        logger.info('Redis disconnected');

        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (shutdownErr) {
        logger.error('Error during graceful shutdown', { error: shutdownErr });
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Graceful shutdown timeout — forcing exit');
      process.exit(1);
    }, 30_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught exception', { error: err });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled rejection', { reason });
    process.exit(1);
  });
}

// ============================================================
// Bootstrap
// ============================================================
async function bootstrap(): Promise<void> {
  try {
    // Verify database connectivity
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected');

    // Verify Redis connectivity
    await redis.ping();
    logger.info('✅ Redis connected');

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = http.createServer(app);

    // Setup WebSocket
    setupWebSocket(server);
    logger.info('✅ WebSocket server initialized');

    // Setup graceful shutdown handlers
    setupGracefulShutdown(server);

    // Start listening
    server.listen(env.PORT, () => {
      logger.info(`🚀 Job Scheduler API running`, {
        port: env.PORT,
        environment: env.NODE_ENV,
        docs: `http://localhost:${env.PORT}/api/docs`,
        health: `http://localhost:${env.PORT}/api/health`,
      });
    });
  } catch (err) {
    logger.error('Failed to start application', { error: err });
    process.exit(1);
  }
}

void bootstrap();
