import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";
import { timing } from "hono/timing";

import { loggerMiddleware } from "./middleware/logger";
import { dbMiddleware } from "./middleware/db";
import { storageMiddleware } from "./middleware/storage";
import { sessionMiddleware } from "./middleware/session";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";

import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { itemsRoutes } from "./routes/items";
import { filesRoutes } from "./routes/files";

import { getCorsOrigins } from "./lib/env";
import type { AppEnv } from "./types/app";

const app = new Hono<AppEnv>();

// Global middleware (order matters!)
app.use("*", requestId());
app.use("*", timing());
app.use("*", secureHeaders());
app.use("*", loggerMiddleware);

// CORS - uses env from bindings
app.use("*", async (c, next) => {
  const origins = getCorsOrigins(c.env);
  const corsMiddleware = cors({
    origin: origins,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposeHeaders: ["X-Request-Id", "X-Response-Time"],
    maxAge: 86400,
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Database & Auth middleware (after CORS, before routes)
app.use("*", dbMiddleware);

// Session middleware - fetches session once and stores in context
// Access via c.get("user") and c.get("session") in any route
// IMPORTANT: Skip for /api/auth/* routes - Better Auth manages sessions internally
app.use("/api/items/*", sessionMiddleware);
app.use("/api/files/*", sessionMiddleware);

// Storage middleware - initializes local or R2 storage based on environment
app.use("/api/files/*", storageMiddleware);

// Routes
app.route("/health", healthRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/items", itemsRoutes);
app.route("/api/files", filesRoutes);

// Root endpoint
app.get("/", (c) => {
  return c.json({
    name: "Hono API Server",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth/*",
      items: "/api/items",
      files: "/api/files",
    },
  });
});

// Error handling
app.onError(errorHandler);
app.notFound(notFoundHandler);

export { app };
