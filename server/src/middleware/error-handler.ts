import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { createLogger } from "../lib/logger";
import { error } from "../lib/api-response";
import type { AppEnv } from "../types/app";

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get("requestId");
  const isProd = c.env?.NODE_ENV === "production";
  const logLevel = (c.env?.LOG_LEVEL as "debug" | "info" | "warn" | "error") || "info";
  const logger = createLogger(logLevel, isProd);

  // Zod validation errors
  if (err instanceof ZodError) {
    logger.warn("Validation error", { requestId, errors: err.flatten() });
    return error(c, "VALIDATION_ERROR", "Invalid request data", 422, err.flatten().fieldErrors);
  }

  // HTTP exceptions (thrown by Hono)
  if (err instanceof HTTPException) {
    logger.warn(`HTTP Exception: ${err.message}`, { requestId, status: err.status });
    return error(c, "HTTP_ERROR", err.message, err.status as 400 | 401 | 403 | 404 | 500);
  }

  // Unknown errors
  logger.error(`Unhandled error: ${err.message}`, {
    requestId,
    stack: err.stack,
  });

  return error(c, "INTERNAL_ERROR", "An unexpected error occurred", 500);
};
