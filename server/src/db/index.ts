import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

// Singleton connection pool - prevents connection leaks
// Each request reuses the same connection instead of creating new ones
let dbInstance: ReturnType<typeof drizzle> | null = null;
let postgresClient: Sql | null = null;

/**
 * Create or return existing database client
 * Uses singleton pattern to prevent connection leaks in Node.js local development
 *
 * - Local: uses DATABASE_URL from environment
 * - Production: uses Hyperdrive binding (configured in wrangler.toml)
 */
export function createDb(connectionString: string) {
  // Return existing instance if available (singleton)
  if (dbInstance && postgresClient) {
    return dbInstance;
  }

  // Create new connection pool
  postgresClient = postgres(connectionString, {
    prepare: false, // Required for Hyperdrive compatibility
    idle_timeout: 20, // Close idle connections after 20 seconds
    max: 10, // Maximum connections in pool
  });

  dbInstance = drizzle(postgresClient, { schema });
  return dbInstance;
}

/**
 * Close database connection
 * Call this on server shutdown for graceful cleanup
 */
export function closeDb() {
  if (postgresClient) {
    postgresClient.end();
    postgresClient = null;
    dbInstance = null;
  }
}

export type Database = ReturnType<typeof createDb>;
