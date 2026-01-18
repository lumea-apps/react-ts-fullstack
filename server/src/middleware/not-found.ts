import type { NotFoundHandler } from "hono";
import { error } from "../lib/api-response";
import type { AppEnv } from "../types/app";

export const notFoundHandler: NotFoundHandler<AppEnv> = (c) => {
  return error(c, "NOT_FOUND", `Route ${c.req.method} ${c.req.path} not found`, 404);
};
