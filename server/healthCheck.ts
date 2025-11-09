/**
 * Health Check and Monitoring Endpoints
 *
 * Provides endpoints for:
 * - Application health status
 * - Database connectivity
 * - System metrics
 * - Connection pool statistics
 */

import { Request, Response } from 'express';
import { getPoolStats } from './db';
import os from 'os';
import process from 'process';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  database?: {
    connected: boolean;
    poolStats?: {
      totalCount: number;
      idleCount: number;
      waitingCount: number;
    };
  };
  system?: {
    platform: string;
    nodeVersion: string;
    memory: {
      total: number;
      free: number;
      used: number;
      usagePercent: number;
    };
    cpu: {
      cores: number;
      loadAverage: number[];
    };
  };
}

/**
 * Basic health check endpoint
 * Returns minimal health status
 */
export function basicHealthCheck(req: Request, res: Response) {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  };

  res.status(200).json(health);
}

/**
 * Detailed health check endpoint
 * Returns comprehensive system information
 */
export function detailedHealthCheck(req: Request, res: Response) {
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const poolStats = getPoolStats();

  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    database: {
      connected: poolStats !== null,
      poolStats: poolStats || undefined,
    },
    system: {
      platform: `${os.type()} ${os.release()}`,
      nodeVersion: process.version,
      memory: {
        total: Math.round(totalMemory / 1024 / 1024),
        free: Math.round(freeMemory / 1024 / 1024),
        used: Math.round(usedMemory / 1024 / 1024),
        usagePercent: Math.round((usedMemory / totalMemory) * 100),
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
      },
    },
  };

  // Determine health status based on metrics
  if (health.system.memory.usagePercent > 90) {
    health.status = 'degraded';
  }

  if (!health.database.connected) {
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}

/**
 * Readiness probe
 * Checks if the application is ready to accept traffic
 */
export function readinessCheck(req: Request, res: Response) {
  const poolStats = getPoolStats();

  const isReady = poolStats !== null;

  if (isReady) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      reason: 'Database connection not established',
    });
  }
}

/**
 * Liveness probe
 * Checks if the application is alive
 */
export function livenessCheck(req: Request, res: Response) {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
