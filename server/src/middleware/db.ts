import type { MiddlewareHandler } from "hono";
import { createDb } from "../db";
import { createAuth } from "../lib/auth";
import type { AppEnv } from "../types/app";

export const dbMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  // Get connection string from Hyperdrive (prod) or DATABASE_URL (local)
  const connectionString = c.env.HYPERDRIVE?.connectionString || c.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Database connection not configured. Set DATABASE_URL or configure Hyperdrive.");
  }

  // Create database client
  const db = createDb(connectionString);
  c.set("db", db);

  // Create auth instance
  const auth = createAuth(db, {
    baseURL: c.env.BETTER_AUTH_URL,
    secret: c.env.BETTER_AUTH_SECRET,
  });
  c.set("auth", auth);

  await next();
};
