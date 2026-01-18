/**
 * Database Seed Script
 *
 * Idempotent seed script for development and ephemeral sandboxes.
 * Safe to run multiple times - uses upsert/conflict handling.
 *
 * Usage:
 *   bun run db:seed
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // ==========================================================================
    // Example: Seed a test user (remove or modify as needed)
    // ==========================================================================
    // This demonstrates idempotent seeding using ON CONFLICT DO NOTHING.
    // The user is only created if it doesn't already exist.

    // await db
    //   .insert(schema.users)
    //   .values({
    //     id: "test-user-id",
    //     name: "Test User",
    //     email: "test@example.com",
    //     emailVerified: true,
    //   })
    //   .onConflictDoNothing({ target: schema.users.email });
    //
    // console.log("✓ Test user seeded");

    // ==========================================================================
    // Example: Seed items
    // ==========================================================================
    // await db
    //   .insert(schema.items)
    //   .values([
    //     { name: "Sample Item 1", description: "First sample item" },
    //     { name: "Sample Item 2", description: "Second sample item" },
    //   ])
    //   .onConflictDoNothing();
    //
    // console.log("✓ Sample items seeded");

    // ==========================================================================
    // Add your seed data below
    // ==========================================================================
    // Patterns:
    //
    // Single record with conflict handling:
    // await db.insert(table).values({ ... }).onConflictDoNothing();
    //
    // Multiple records:
    // await db.insert(table).values([{ ... }, { ... }]).onConflictDoNothing();
    //
    // Upsert (update if exists):
    // await db.insert(table).values({ ... }).onConflictDoUpdate({
    //   target: table.uniqueColumn,
    //   set: { updatedAt: new Date() },
    // });

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
