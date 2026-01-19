import type { Env } from "hono";
import type { Database } from "../db";
import type { Auth } from "../lib/auth";

export interface Bindings {
  // Environment
  NODE_ENV: string;
  CORS_ORIGINS: string;
  LOG_LEVEL: string;

  // Auth
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;

  // Database - Hyperdrive (production) or direct URL (local)
  HYPERDRIVE?: Hyperdrive;
  DATABASE_URL?: string;

  // Storage (uncomment when needed)
  // STORAGE: R2Bucket;

  // KV (uncomment when needed)
  // CACHE: KVNamespace;
}

// Session types from Better Auth
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppEnv extends Env {
  Bindings: Bindings;
  Variables: {
    requestId: string;
    db: Database;
    auth: Auth;
    // Session data (populated by session middleware)
    user: SessionUser | null;
    session: Session | null;
  };
}
