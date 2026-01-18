import type { Bindings } from "../types/app";

/**
 * Get CORS origins from environment
 *
 * Supports both Cloudflare Workers (env bindings) and Node.js (process.env).
 * Falls back to localhost for local development.
 */
export function getCorsOrigins(env: Bindings): string[] {
  const origins =
    env.CORS_ORIGINS ||
    process.env.CORS_ORIGINS ||
    "http://localhost:3000,http://localhost:5173";
  return origins.split(",");
}
