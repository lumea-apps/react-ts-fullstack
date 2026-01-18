/**
 * Node.js server for local development
 *
 * This file provides a Node.js runtime for the Hono application,
 * allowing local development without Wrangler (which has compatibility
 * issues in certain environments like Daytona sandboxes).
 *
 * The same Hono app code runs in both:
 * - Local development: Node.js with @hono/node-server (this file)
 * - Production: Cloudflare Workers via Wrangler
 *
 * Usage:
 *   bun run dev:node
 *
 * Environment variables:
 *   DATABASE_URL - PostgreSQL connection string
 *   PORT - Server port (default: 3001)
 *   CORS_ORIGINS - Comma-separated allowed origins
 *   BETTER_AUTH_URL - Base URL for auth
 *   BETTER_AUTH_SECRET - Secret for auth tokens
 *
 * @see https://hono.dev/docs/getting-started/nodejs
 */
import { serve } from "@hono/node-server";
import { app } from "./app";
import { closeDb } from "./db";

const port = parseInt(process.env.PORT || "3001");

console.log(`
🚀 Hono Server (Node.js) starting...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 URL:      http://localhost:${port}
📝 Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}
🔐 Auth:     ${process.env.BETTER_AUTH_URL || `http://localhost:${port}`}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

const server = serve({
  fetch: app.fetch,
  port,
});

// Graceful shutdown - close database connections
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  server.close();
  closeDb();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down...");
  server.close();
  closeDb();
  process.exit(0);
});
