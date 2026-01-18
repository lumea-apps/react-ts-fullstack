import type { MiddlewareHandler } from "hono";
import { createLogger } from "../lib/logger";
import type { AppEnv } from "../types/app";

export const loggerMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const requestId = c.get("requestId");

  const isProd = c.env?.NODE_ENV === "production";
  const logLevel = (c.env?.LOG_LEVEL as "debug" | "info" | "warn" | "error") || "info";
  const logger = createLogger(logLevel, isProd);

  logger.info(`→ ${method} ${path}`, { requestId });

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  const logFn = status >= 500 ? logger.error : status >= 400 ? logger.warn : logger.info;
  logFn(`← ${method} ${path} ${status} ${duration}ms`, { requestId });
};
