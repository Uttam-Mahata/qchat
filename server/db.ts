import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import { Pool, neonConfig } from '@neondatabase/serverless';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use SQLite for local development if DATABASE_URL is not set
let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzleSQLite>;

if (process.env.DATABASE_URL) {
  // Production: Use Neon PostgreSQL
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
  console.log('Using Neon PostgreSQL database');
} else {
  // Development: Use SQLite
  const sqlite = new Database('qchat.db');
  sqlite.pragma('journal_mode = WAL');
  db = drizzleSQLite(sqlite, { schema });
  console.log('Using SQLite database (qchat.db)');
}

export { db };
