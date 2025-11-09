/**
 * Production Error Handling Middleware
 *
 * Implements comprehensive error handling:
 * - Catches all unhandled errors
 * - Logs errors with context
 * - Sanitizes error messages for production
 * - Returns appropriate HTTP status codes
 * - Prevents information leakage
 */

import { Request, Response, NextFunction } from 'express';
import logger, { logError } from '../logger';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Create an operational error (expected errors like validation failures)
 */
export function createError(message: string, statusCode: number = 400): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

/**
 * Global error handler middleware
 * Must be added AFTER all routes
 */
export function errorHandler(
  err: AppError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    logError(err, {
      path: req.path,
      method: req.method,
      body: req.body,
      validationErrors: err.errors,
    });

    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Default status code
  const statusCode = (err as AppError).statusCode || 500;
  const isOperational = (err as AppError).isOperational || false;

  // Log error with context
  logError(err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
    statusCode,
    isOperational,
  });

  // In production, don't leak error details for non-operational errors
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const message = isOperational || isDevelopment
    ? err.message
    : 'An unexpected error occurred';

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(isDevelopment && { stack: err.stack }),
  });
}

/**
 * Async route wrapper to catch promise rejections
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
}
