import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Create database client
// - Local: uses DATABASE_URL from environment
// - Production: uses Hyperdrive binding (configured in wrangler.toml)
export function createDb(connectionString: string) {
  const client = postgres(connectionString, {
    prepare: false, // Required for Hyperdrive
  });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
