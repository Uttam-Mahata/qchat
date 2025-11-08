import { defineConfig } from "drizzle-kit";

// Use SQLite for local development if DATABASE_URL is not set
const config = process.env.DATABASE_URL
  ? // PostgreSQL configuration for production
    defineConfig({
      out: "./migrations",
      schema: "./shared/schema.ts",
      dialect: "postgresql",
      dbCredentials: {
        url: process.env.DATABASE_URL,
      },
    })
  : // SQLite configuration for development
    defineConfig({
      out: "./migrations",
      schema: "./shared/schema.ts",
      dialect: "sqlite",
      dbCredentials: {
        url: "qchat.db",
      },
    });

export default config;
