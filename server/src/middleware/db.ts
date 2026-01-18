import type { MiddlewareHandler } from "hono";
import { createDb } from "../db";
import { createAuth } from "../lib/auth";
import type { AppEnv } from "../types/app";

/**
 * Database middleware - provides db and auth to all routes
 *
 * Supports both Cloudflare Workers (c.env) and Node.js (process.env) environments.
 * This allows the same Hono code to run in:
 * - Local development: Node.js with @hono/node-server
 * - Production: Cloudflare Workers with Wrangler
 */
export const dbMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  // Get connection string - supports Workers (c.env) and Node.js (process.env)
  const connectionString =
    c.env.HYPERDRIVE?.connectionString ||
    c.env.DATABASE_URL ||
    process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Database connection not configured. Set DATABASE_URL or configure Hyperdrive."
    );
  }

  // Create database client (singleton - reuses connection)
  const db = createDb(connectionString);
  c.set("db", db);

  // Get auth config - supports Workers (c.env) and Node.js (process.env)
  const baseURL =
    c.env.BETTER_AUTH_URL ||
    process.env.BETTER_AUTH_URL ||
    `http://localhost:${process.env.PORT || 3001}`;

  const secret =
    c.env.BETTER_AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    "dev-secret-change-in-production";

  // Create auth instance
  const auth = createAuth(db, {
    baseURL,
    secret,
  });
  c.set("auth", auth);

  await next();
};
