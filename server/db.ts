/**
 * Production Database Configuration
 *
 * Implements PostgreSQL connection pooling with:
 * - Connection reuse for performance
 * - Automatic reconnection on failure
 * - Configurable pool sizing
 * - SSL/TLS encryption for secure connections
 * - Graceful shutdown handling
 */

import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import pg from 'pg';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import 'dotenv/config';

const { Pool } = pg;

// Type for database instance
let db: ReturnType<typeof drizzlePostgres> | ReturnType<typeof drizzleSQLite>;
let pool: pg.Pool | null = null;

if (process.env.DATABASE_URL) {
  // Production: Use PostgreSQL with connection pooling

  // Parse SSL certificate if provided via environment variable
  const sslConfig = process.env.DB_SSL_CERT
    ? {
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CERT
      }
    : {
        rejectUnauthorized: true,
        // For managed PostgreSQL services, use system CA certificates
      };

  // Create connection pool with production-ready configuration
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    // Connection pool configuration
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '10000'),
    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  // Connection error handling
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
  });

  pool.on('connect', (client) => {
    console.log('New database client connected to pool');
  });

  pool.on('remove', () => {
    console.log('Database client removed from pool');
  });

  // Initialize Drizzle ORM with PostgreSQL
  db = drizzlePostgres(pool, { schema });

  console.log('✓ Using PostgreSQL database with connection pooling');
  console.log(`  Pool configuration: min=${pool.options.min}, max=${pool.options.max}`);

  // Test initial connection
  pool.query('SELECT NOW()', (err, result) => {
    if (err) {
      console.error('✗ Database connection test failed:', err.message);
    } else {
      console.log('✓ Database connection test successful');
      console.log(`  Server time: ${result.rows[0].now}`);
    }
  });

} else {
  // Development: Use SQLite for local testing
  const sqlite = new Database('qchat.db');
  sqlite.pragma('journal_mode = WAL');
  db = drizzleSQLite(sqlite, { schema });
  console.log('Using SQLite database (qchat.db) - Development mode');
}

/**
 * Graceful database shutdown
 * Call this when shutting down the application
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    console.log('Closing database connection pool...');
    await pool.end();
    console.log('✓ Database pool closed');
  }
}

/**
 * Get pool statistics for monitoring
 */
export function getPoolStats() {
  if (pool) {
    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
  }
  return null;
}

export { db, pool };
