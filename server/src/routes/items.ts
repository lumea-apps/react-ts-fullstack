import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/api-response";
import { items } from "../db/schema";
import { getCurrentUser } from "../middleware/auth";
import type { AppEnv } from "../types/app";

// Validation schemas
const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateItemSchema = createItemSchema.partial();

const itemIdSchema = z.object({
  id: z.string().uuid(),
});

const itemsRoutes = new Hono<AppEnv>();

// GET /api/items - List all items
itemsRoutes.get("/", async (c) => {
  const db = c.get("db");
  const itemsList = await db.select().from(items);
  return success(c, { items: itemsList, total: itemsList.length });
});

// GET /api/items/:id - Get item by ID
itemsRoutes.get("/:id", zValidator("param", itemIdSchema), async (c) => {
  const { id } = c.req.valid("param");
  const db = c.get("db");

  const [item] = await db.select().from(items).where(eq(items.id, id));

  if (!item) {
    return error(c, "ITEM_NOT_FOUND", `Item with id ${id} not found`, 404);
  }

  return success(c, item);
});

// POST /api/items - Create new item
itemsRoutes.post("/", zValidator("json", createItemSchema), async (c) => {
  const data = c.req.valid("json");
  const db = c.get("db");
  const user = await getCurrentUser(c);

  const [item] = await db
    .insert(items)
    .values({
      name: data.name,
      description: data.description,
      userId: user?.id,
    })
    .returning();

  return success(c, item, 201);
});

// PUT /api/items/:id - Update item
itemsRoutes.put(
  "/:id",
  zValidator("param", itemIdSchema),
  zValidator("json", updateItemSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const db = c.get("db");

    const [existing] = await db.select().from(items).where(eq(items.id, id));

    if (!existing) {
      return error(c, "ITEM_NOT_FOUND", `Item with id ${id} not found`, 404);
    }

    const [item] = await db
      .update(items)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(items.id, id))
      .returning();

    return success(c, item);
  }
);

// DELETE /api/items/:id - Delete item
itemsRoutes.delete("/:id", zValidator("param", itemIdSchema), async (c) => {
  const { id } = c.req.valid("param");
  const db = c.get("db");

  const [existing] = await db.select().from(items).where(eq(items.id, id));

  if (!existing) {
    return error(c, "ITEM_NOT_FOUND", `Item with id ${id} not found`, 404);
  }

  await db.delete(items).where(eq(items.id, id));

  return success(c, { deleted: true });
});

export { itemsRoutes };
