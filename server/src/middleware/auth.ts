import type { MiddlewareHandler, Context } from "hono";
import { error } from "../lib/api-response";
import type { AppEnv, SessionUser, Session } from "../types/app";

/**
 * Require Authentication Middleware
 *
 * As per Better Auth official docs, this middleware uses the session
 * data already populated by the global sessionMiddleware.
 *
 * The session is fetched once globally and stored in context,
 * so we don't need to call auth.api.getSession() again.
 */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = c.get("user");

  if (!user) {
    return error(c, "UNAUTHORIZED", "Authentication required", 401);
  }

  await next();
};

/**
 * Get current user from context (returns null if not authenticated)
 *
 * Uses the session data already populated by sessionMiddleware.
 * No additional API calls needed.
 */
export function getCurrentUser(c: Context<AppEnv>): SessionUser | null {
  return c.get("user");
}

/**
 * Get current session from context (returns null if not authenticated)
 *
 * Uses the session data already populated by sessionMiddleware.
 * No additional API calls needed.
 */
export function getSession(c: Context<AppEnv>): Session | null {
  return c.get("session");
}
