import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/**
 * Files table - tracks uploaded files metadata
 *
 * The actual file content is stored in:
 * - Local filesystem (development): server/storage/
 * - R2 bucket (production): Cloudflare R2
 */
export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull().unique(), // Storage path/key (e.g., "uploads/1234-file.png")
    filename: text("filename").notNull(), // Original filename
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(), // File size in bytes
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(), // Optional extra data
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("files_user_id_idx").on(table.userId),
    index("files_key_idx").on(table.key),
  ]
);

export const filesRelations = relations(files, ({ one }) => ({
  user: one(user, {
    fields: [files.userId],
    references: [user.id],
  }),
}));

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
