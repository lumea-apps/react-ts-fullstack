import type { Context } from "hono";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId?: string;
    timestamp: string;
  };
}

export function success<T>(c: Context, data: T, status: 200 | 201 = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      requestId: c.get("requestId"),
      timestamp: new Date().toISOString(),
    },
  };
  return c.json(response, status);
}

export function error(
  c: Context,
  code: string,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 500 | 501 | 503 = 500,
  details?: unknown
) {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details: details ?? undefined,
    },
    meta: {
      requestId: c.get("requestId"),
      timestamp: new Date().toISOString(),
    },
  };
  return c.json(response, status);
}
