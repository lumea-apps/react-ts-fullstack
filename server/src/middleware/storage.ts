import { createMiddleware } from "hono/factory";
import { getStorageService } from "../lib/storage";
import type { AppEnv } from "../types/app";

/**
 * Storage middleware
 *
 * Initializes the appropriate storage service based on environment:
 * - R2 bucket in production (Cloudflare Workers)
 * - Local filesystem in development (Node.js)
 *
 * Makes storage available via c.get("storage")
 */
export const storageMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const storage = getStorageService(c.env);
  c.set("storage", storage);
  await next();
});
