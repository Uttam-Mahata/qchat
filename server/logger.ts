/**
 * Production Logging System
 *
 * Implements comprehensive application logging with:
 * - Multiple log levels (error, warn, info, debug)
 * - Daily log rotation
 * - Structured JSON logging for production
 * - Console output for development
 * - Separate error log file
 * - Automatic log file management
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import 'dotenv/config';

const isDevelopment = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
const logDir = process.env.LOG_DIR || 'logs';

// Custom format for console output in development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// JSON format for production logs
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: isDevelopment ? consoleFormat : jsonFormat,
    level: logLevel,
  })
);

// File transports for production
if (!isDevelopment) {
  // Daily rotating file for all logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'qchat-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: jsonFormat,
      level: logLevel,
    })
  );

  // Separate file for errors only
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'qchat-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: jsonFormat,
      level: 'error',
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: logLevel,
  transports,
  exitOnError: false,
});

// Add request logging helper
export interface RequestLogData {
  method: string;
  url: string;
  ip?: string;
  userId?: number;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
}

export function logRequest(data: RequestLogData) {
  logger.info('HTTP Request', data);
}

// Add security event logging
export interface SecurityEventData {
  event: 'login_success' | 'login_failed' | 'registration' | 'key_exchange' | 'unauthorized_access' | 'rate_limit_exceeded';
  userId?: number;
  username?: string;
  ip?: string;
  details?: any;
}

export function logSecurityEvent(data: SecurityEventData) {
  logger.info('Security Event', data);
}

// Add database event logging
export interface DatabaseEventData {
  operation: 'query' | 'insert' | 'update' | 'delete' | 'connection';
  table?: string;
  duration?: number;
  error?: string;
}

export function logDatabaseEvent(data: DatabaseEventData) {
  if (data.error) {
    logger.error('Database Error', data);
  } else {
    logger.debug('Database Operation', data);
  }
}

// Add error logging with context
export function logError(error: Error, context?: any) {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
  });
}

// Export logger instance and helpers
export default logger;
