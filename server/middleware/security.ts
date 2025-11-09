/**
 * Security Middleware Collection
 *
 * Implements multiple security layers:
 * - Rate limiting (DDoS protection)
 * - Security headers (Helmet)
 * - CORS configuration
 * - Request size limits
 * - HTTPS enforcement
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import logger, { logSecurityEvent } from '../logger';
import 'dotenv/config';

/**
 * General API rate limiter
 * Limits requests per IP address
 */
export const generalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logSecurityEvent({
      event: 'rate_limit_exceeded',
      ip: req.ip,
      details: { path: req.path, method: req.method },
    });

    res.status(429).json({
      error: 'Too many requests, please try again later',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Only count failed attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logSecurityEvent({
      event: 'rate_limit_exceeded',
      ip: req.ip,
      details: {
        path: req.path,
        type: 'authentication',
        username: req.body.username,
      },
    });

    res.status(429).json({
      error: 'Too many login attempts, please try again later',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

/**
 * CORS configuration
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5000'];

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
});

/**
 * HTTPS enforcement middleware
 * Redirects HTTP to HTTPS in production
 */
export function enforceHTTPS(req: Request, res: Response, next: NextFunction) {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check if request is secure
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

  if (!isSecure) {
    logger.warn('HTTP request redirected to HTTPS', {
      ip: req.ip,
      path: req.path,
    });

    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }

  next();
}

/**
 * Request size validation middleware
 */
export function validateRequestSize(req: Request, res: Response, next: NextFunction) {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024;

  const contentLength = parseInt(req.headers['content-length'] || '0');

  if (contentLength > maxSize) {
    logSecurityEvent({
      event: 'unauthorized_access',
      ip: req.ip,
      details: {
        reason: 'Request size exceeded',
        size: contentLength,
        maxSize,
      },
    });

    return res.status(413).json({
      error: 'Request entity too large',
      maxSize: `${process.env.MAX_FILE_SIZE_MB || 10}MB`,
    });
  }

  next();
}
