/**
 * Better Auth Configuration (Static)
 *
 * This file is used by both:
 * 1. Better Auth CLI for migrations (`npx @better-auth/cli migrate`)
 * 2. Runtime auth initialization
 *
 * The CLI reads this file to determine database configuration and run migrations.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Get database URL from environment
const databaseUrl =
  process.env.DATABASE_URL || "postgresql://lumea:lumea@localhost:5432/lumea";

// Create database client for CLI operations
const client = postgres(databaseUrl);
const db = drizzle(client);

/**
 * Better Auth configuration
 *
 * This configuration is used by the CLI for:
 * - Generating schema (`npx @better-auth/cli generate`)
 * - Running migrations (`npx @better-auth/cli migrate`)
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
});

export type Auth = typeof auth;
