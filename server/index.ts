/**
 * QChat Production Server
 *
 * Post-Quantum Cryptography Chat Application
 * Production-grade server with:
 * - PostgreSQL connection pooling
 * - AES-256-GCM + ML-KEM-768 encryption
 * - Rate limiting and DDoS protection
 * - Security headers and HTTPS enforcement
 * - Comprehensive logging and monitoring
 * - Graceful shutdown handling
 */

import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import compression from 'compression';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { closeDatabase } from './db';
import logger from './logger';

// Import middleware
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import {
  generalRateLimiter,
  authRateLimiter,
  securityHeaders,
  corsMiddleware,
  enforceHTTPS,
  validateRequestSize,
} from './middleware/security';

// Import health check endpoints
import {
  basicHealthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck,
} from './healthCheck';

const app = express();
const isDevelopment = process.env.NODE_ENV !== 'production';

logger.info('Starting QChat server', {
  environment: process.env.NODE_ENV,
  nodeVersion: process.version,
});

// Trust proxy for proper IP address handling (needed for rate limiting, logging)
app.set('trust proxy', 1);

// Security middleware (must be early in the chain)
app.use(enforceHTTPS);
app.use(corsMiddleware);
app.use(securityHeaders);

// Compression middleware for response optimization
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// Request parsing middleware
declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request validation
app.use(validateRequestSize);

// Request logging middleware (production logger)
app.use(requestLogger);

// Health check endpoints (before rate limiting)
app.get('/health', basicHealthCheck);
app.get('/health/detailed', detailedHealthCheck);
app.get('/health/ready', readinessCheck);
app.get('/health/live', livenessCheck);

// Rate limiting middleware
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api', generalRateLimiter);

(async () => {
  try {
    // Register application routes (API and WebSocket)
    const server = await registerRoutes(app);

    // Importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (isDevelopment) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // 404 handler (must be before error handler)
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    const port = parseInt(process.env.PORT || '5000', 10);
    const host = process.env.HOST || '0.0.0.0';

    server.listen({
      port,
      host,
      reusePort: true,
    }, () => {
      logger.info(`✓ QChat server running`, {
        port,
        host,
        environment: process.env.NODE_ENV,
        processId: process.pid,
      });
      log(`serving on port ${port}`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async (err) => {
        if (err) {
          logger.error('Error closing server', err);
          process.exit(1);
        }

        logger.info('HTTP server closed');

        try {
          // Close database connection pool
          await closeDatabase();

          logger.info('✓ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', error as Error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', error);
      shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Promise Rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack,
      });
    });

  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
})();
