/**
 * HTTP Request Logging Middleware
 *
 * Logs all incoming HTTP requests with:
 * - Request method and URL
 * - Response status code and time
 * - Client IP address
 * - User agent
 * - Authenticated user ID (if available)
 */

import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Capture response finish event
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    logRequest({
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.socket.remoteAddress,
      userId: (req as any).user?.id,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('user-agent'),
    });
  });

  next();
}
