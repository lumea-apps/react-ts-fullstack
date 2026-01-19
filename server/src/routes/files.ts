import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/api-response";
import { files } from "../db/storage-schema";
import type { AppEnv } from "../types/app";

const filesRoutes = new Hono<AppEnv>();

/**
 * POST /api/files - Upload a file
 *
 * Supports:
 * - multipart/form-data with "file" field
 * - Raw binary upload with Content-Type header
 */
filesRoutes.post("/", async (c) => {
  const storage = c.get("storage");
  const db = c.get("db");
  const user = c.get("user");

  const contentType = c.req.header("content-type") || "";

  let key: string;
  let filename: string;
  let mimeType: string;
  let fileData: ReadableStream | ArrayBuffer;
  let size: number;

  // Handle multipart form data
  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return error(c, "MISSING_FILE", "No file provided", 400);
    }

    filename = file.name;
    mimeType = file.type || "application/octet-stream";
    size = file.size;
    key = `uploads/${Date.now()}-${filename}`;
    fileData = file.stream();
  } else {
    // Handle raw binary upload
    const body = await c.req.arrayBuffer();
    filename = c.req.header("x-filename") || `file-${Date.now()}`;
    mimeType = contentType || "application/octet-stream";
    size = body.byteLength;
    key = `uploads/${Date.now()}-${filename}`;
    fileData = body;
  }

  // Upload to storage (R2 or local filesystem)
  const result = await storage.upload(key, fileData, mimeType);

  // Save metadata to database
  const [fileRecord] = await db
    .insert(files)
    .values({
      key,
      filename,
      mimeType,
      size,
      userId: user?.id || null,
    })
    .returning();

  return success(
    c,
    {
      id: fileRecord.id,
      key: fileRecord.key,
      filename: fileRecord.filename,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      url: result.url,
      createdAt: fileRecord.createdAt,
    },
    201
  );
});

/**
 * GET /api/files - List all files
 */
filesRoutes.get("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");

  // Get files for current user (or all if admin/no auth required)
  const fileList = await db
    .select({
      id: files.id,
      key: files.key,
      filename: files.filename,
      mimeType: files.mimeType,
      size: files.size,
      createdAt: files.createdAt,
    })
    .from(files)
    .where(user ? eq(files.userId, user.id) : undefined)
    .orderBy(files.createdAt);

  return success(c, fileList);
});

/**
 * GET /api/files/:key - Download a file
 */
filesRoutes.get("/:key{.+}", async (c) => {
  const storage = c.get("storage");
  const db = c.get("db");
  const key = c.req.param("key");

  // Check if file exists in database
  const [fileRecord] = await db
    .select()
    .from(files)
    .where(eq(files.key, key))
    .limit(1);

  if (!fileRecord) {
    return error(c, "FILE_NOT_FOUND", `File ${key} not found`, 404);
  }

  // Get file from storage
  const file = await storage.download(key);

  if (!file) {
    return error(c, "FILE_NOT_FOUND", `File ${key} not found in storage`, 404);
  }

  return new Response(file.data, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${fileRecord.filename}"`,
    },
  });
});

/**
 * DELETE /api/files/:key - Delete a file
 */
filesRoutes.delete("/:key{.+}", async (c) => {
  const storage = c.get("storage");
  const db = c.get("db");
  const user = c.get("user");
  const key = c.req.param("key");

  // Check if file exists and belongs to user
  const [fileRecord] = await db
    .select()
    .from(files)
    .where(eq(files.key, key))
    .limit(1);

  if (!fileRecord) {
    return error(c, "FILE_NOT_FOUND", `File ${key} not found`, 404);
  }

  // Check ownership (if user is authenticated)
  if (user && fileRecord.userId && fileRecord.userId !== user.id) {
    return error(c, "FORBIDDEN", "You do not have permission to delete this file", 403);
  }

  // Delete from storage
  await storage.delete(key);

  // Delete from database
  await db.delete(files).where(eq(files.key, key));

  return success(c, { deleted: true, key });
});

export { filesRoutes };
