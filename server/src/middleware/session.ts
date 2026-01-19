import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types/app";

/**
 * Session Middleware - retrieves session from request headers
 *
 * As per Better Auth official docs, this middleware:
 * - Fetches the session using auth.api.getSession()
 * - Stores user and session data in the Hono context
 * - Returns null values if no valid session exists
 *
 * This allows access to authenticated user and session information
 * across all routes via c.get("user") and c.get("session").
 */
export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const auth = c.get("auth");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
};
