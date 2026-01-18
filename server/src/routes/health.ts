import { Hono } from "hono";
import type { AppEnv } from "../types/app";

const healthRoutes = new Hono<AppEnv>();

healthRoutes.get("/", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: c.env.NODE_ENV,
  });
});

healthRoutes.get("/ready", (c) => {
  // Add database/service checks here
  const checks = {
    server: true,
    // database: await checkDatabase(c.env.DB),
  };

  const allHealthy = Object.values(checks).every(Boolean);

  return c.json(
    {
      status: allHealthy ? "ready" : "not_ready",
      checks,
      timestamp: new Date().toISOString(),
    },
    allHealthy ? 200 : 503
  );
});

healthRoutes.get("/live", (c) => {
  return c.json({ status: "alive" });
});

export { healthRoutes };
