import type { MiddlewareHandler, Context } from "hono";
import { error } from "../lib/api-response";
import type { AppEnv } from "../types/app";

// Middleware to require authentication
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const auth = c.get("auth");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return error(c, "UNAUTHORIZED", "Authentication required", 401);
  }

  await next();
};

// Helper: Get current user (returns null if not authenticated)
export async function getCurrentUser(c: Context<AppEnv>) {
  const auth = c.get("auth");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user ?? null;
}

// Helper: Get current session (returns null if not authenticated)
export async function getSession(c: Context<AppEnv>) {
  const auth = c.get("auth");
  return auth.api.getSession({ headers: c.req.raw.headers });
}
