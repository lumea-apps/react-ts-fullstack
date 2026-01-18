import { Hono } from "hono";
import type { AppEnv } from "../types/app";

const authRoutes = new Hono<AppEnv>();

// Better Auth handles all routes under /api/auth/*
authRoutes.all("/*", async (c) => {
  const auth = c.get("auth");
  return auth.handler(c.req.raw);
});

export { authRoutes };
