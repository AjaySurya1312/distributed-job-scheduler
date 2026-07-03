"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const redis_1 = require("./config/redis");
const prisma_1 = require("./config/prisma");
const request_id_middleware_1 = require("./middlewares/request-id.middleware");
const error_middleware_1 = require("./middlewares/error.middleware");
const rate_limit_middleware_1 = require("./middlewares/rate-limit.middleware");
const swagger_1 = require("./config/swagger");
const routes_1 = require("./routes");
// ============================================================
// Application Factory
// ============================================================
function createApp() {
    const app = (0, express_1.default)();
    // ---- Trust proxy (for rate limiting behind Nginx) ----
    app.set('trust proxy', 1);
    // ---- Security headers (must be first) ----
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // Allow Swagger UI
        crossOriginEmbedderPolicy: false,
    }));
    // ---- CORS ----
    const allowedOrigins = env_1.env.CORS_ORIGINS.split(',').map(o => o.trim());
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, Postman)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error(`CORS: Origin ${origin} not allowed`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
        exposedHeaders: ['X-Request-ID', 'X-Total-Count'],
    }));
    // ---- Body parsing ----
    app.use((0, compression_1.default)());
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // ---- Request ID (must be before logger) ----
    app.use(request_id_middleware_1.requestIdMiddleware);
    // ---- HTTP request logging ----
    if (env_1.env.NODE_ENV !== 'test') {
        app.use((0, morgan_1.default)('combined', {
            stream: {
                write: (message) => logger_1.logger.http(message.trim()),
            },
        }));
    }
    // ---- Global rate limiting ----
    app.use('/api', rate_limit_middleware_1.defaultLimiter);
    // ---- API Documentation ----
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Job Scheduler API Docs',
    }));
    // ---- Health check (unauthenticated) ----
    app.get('/api/health', async (_req, res) => {
        try {
            // Check PostgreSQL
            await prisma_1.prisma.$queryRaw `SELECT 1`;
            // Check Redis
            await redis_1.redis.ping();
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
        }
        catch (err) {
            logger_1.logger.error('Health check failed', { error: err });
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }
    });
    // ---- API Routes ----
    app.use('/api', routes_1.router);
    // ---- 404 handler ----
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: 'The requested endpoint does not exist',
            },
        });
    });
    // ---- Global error handler (must be last) ----
    app.use(error_middleware_1.errorHandler);
    return app;
}
// ============================================================
// WebSocket Server Setup
// ============================================================
function setupWebSocket(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: env_1.env.CORS_ORIGINS.split(',').map(o => o.trim()),
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });
    io.on('connection', (socket) => {
        logger_1.logger.debug(`WebSocket client connected: ${socket.id}`);
        // Client subscribes to their org's events
        socket.on('subscribe', (orgId) => {
            if (orgId && typeof orgId === 'string') {
                socket.join(`org:${orgId}`);
                logger_1.logger.debug(`Socket ${socket.id} subscribed to org:${orgId}`);
            }
        });
        socket.on('unsubscribe', (orgId) => {
            socket.leave(`org:${orgId}`);
        });
        socket.on('disconnect', (reason) => {
            logger_1.logger.debug(`WebSocket client disconnected: ${socket.id}, reason: ${reason}`);
        });
    });
    // Subscribe to Redis PubSub channels and broadcast to connected clients
    const subscriber = redis_1.redis.duplicate();
    subscriber.subscribe('job-events', 'worker-events', 'metrics-stream', (err, count) => {
        if (err) {
            logger_1.logger.error('Redis PubSub subscription error', { error: err });
            return;
        }
        logger_1.logger.info(`Subscribed to ${count} Redis PubSub channels`);
    });
    subscriber.on('message', (channel, message) => {
        try {
            const payload = JSON.parse(message);
            if (payload.orgId) {
                // Broadcast to org-specific room
                io.to(`org:${payload.orgId}`).emit('event', {
                    channel,
                    ...payload,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                // Broadcast to all connected clients
                io.emit('event', {
                    channel,
                    ...payload,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch {
            logger_1.logger.warn('Failed to parse Redis PubSub message', { channel, message });
        }
    });
    return io;
}
// ============================================================
// Graceful Shutdown
// ============================================================
function setupGracefulShutdown(server) {
    const shutdown = async (signal) => {
        logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
        // Stop accepting new connections
        server.close(async (err) => {
            if (err) {
                logger_1.logger.error('Error closing HTTP server', { error: err });
            }
            try {
                // Close database connection
                await prisma_1.prisma.$disconnect();
                logger_1.logger.info('PostgreSQL disconnected');
                // Close Redis connection
                await redis_1.redis.quit();
                logger_1.logger.info('Redis disconnected');
                logger_1.logger.info('Graceful shutdown complete');
                process.exit(0);
            }
            catch (shutdownErr) {
                logger_1.logger.error('Error during graceful shutdown', { error: shutdownErr });
                process.exit(1);
            }
        });
        // Force shutdown after 30 seconds
        setTimeout(() => {
            logger_1.logger.error('Graceful shutdown timeout — forcing exit');
            process.exit(1);
        }, 30_000);
    };
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('uncaughtException', (err) => {
        logger_1.logger.error('Uncaught exception', { error: err });
        process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
        logger_1.logger.error('Unhandled rejection', { reason });
        process.exit(1);
    });
}
// ============================================================
// Bootstrap
// ============================================================
async function bootstrap() {
    try {
        // Verify database connectivity
        await prisma_1.prisma.$connect();
        logger_1.logger.info('✅ PostgreSQL connected');
        // Verify Redis connectivity
        await redis_1.redis.ping();
        logger_1.logger.info('✅ Redis connected');
        // Create Express app
        const app = createApp();
        // Create HTTP server
        const server = http_1.default.createServer(app);
        // Setup WebSocket
        setupWebSocket(server);
        logger_1.logger.info('✅ WebSocket server initialized');
        // Setup graceful shutdown handlers
        setupGracefulShutdown(server);
        // Start listening
        server.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`🚀 Job Scheduler API running`, {
                port: env_1.env.PORT,
                environment: env_1.env.NODE_ENV,
                docs: `http://localhost:${env_1.env.PORT}/api/docs`,
                health: `http://localhost:${env_1.env.PORT}/api/health`,
            });
        });
    }
    catch (err) {
        logger_1.logger.error('Failed to start application', { error: err });
        process.exit(1);
    }
}
void bootstrap();
//# sourceMappingURL=index.js.map