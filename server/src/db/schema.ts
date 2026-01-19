import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// ============================================
// App Schema (your tables)
// ============================================
// NOTE: Better Auth tables (user, session, account, verification)
// are managed by Better Auth CLI. Run `bun run db:auth` to create/update them.

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("user_id"), // References Better Auth user table
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
