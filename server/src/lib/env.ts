import type { Bindings } from "../types/app";

export function getCorsOrigins(env: Bindings): string[] {
  return env.CORS_ORIGINS.split(",");
}
