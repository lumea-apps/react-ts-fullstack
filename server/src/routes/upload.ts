import { Hono } from "hono";
// import { createStorageService } from "../lib/storage";
import { success, error } from "../lib/api-response";
import type { AppEnv } from "../types/app";

const uploadRoutes = new Hono<AppEnv>();

// POST /api/upload - Upload a file
uploadRoutes.post("/", async (c) => {
  // Uncomment when R2 is configured
  // const storage = createStorageService(c.env.STORAGE);

  const contentType = c.req.header("content-type") || "";

  // Handle multipart form data
  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return error(c, "MISSING_FILE", "No file provided", 400);
    }

    const key = `uploads/${Date.now()}-${file.name}`;

    // Uncomment when R2 is configured:
    // const result = await storage.upload(key, file.stream(), file.type);
    // return success(c, result, 201);

    // Placeholder response
    return success(c, {
      key,
      size: file.size,
      type: file.type,
      message: "R2 not configured - uncomment in wrangler.toml and types/app.ts",
    }, 201);
  }

  // Handle raw binary upload
  const body = await c.req.arrayBuffer();
  const key = `uploads/${Date.now()}`;

  // Uncomment when R2 is configured:
  // const result = await storage.upload(key, body, contentType);
  // return success(c, result, 201);

  return success(c, {
    key,
    size: body.byteLength,
    message: "R2 not configured - uncomment in wrangler.toml and types/app.ts",
  }, 201);
});

// GET /api/upload/:key - Download a file
uploadRoutes.get("/:key{.+}", async (c) => {
  // Uncomment when R2 is configured:
  // const storage = createStorageService(c.env.STORAGE);
  // const key = c.req.param("key");
  // const file = await storage.download(key);
  //
  // if (!file) {
  //   return error(c, "FILE_NOT_FOUND", `File ${key} not found`, 404);
  // }
  //
  // return new Response(file.data, {
  //   headers: { "Content-Type": file.contentType },
  // });

  return error(c, "NOT_CONFIGURED", "R2 not configured", 501);
});

// DELETE /api/upload/:key - Delete a file
uploadRoutes.delete("/:key{.+}", async (c) => {
  // Uncomment when R2 is configured:
  // const storage = createStorageService(c.env.STORAGE);
  // const key = c.req.param("key");
  // await storage.delete(key);
  // return success(c, { deleted: true });

  return error(c, "NOT_CONFIGURED", "R2 not configured", 501);
});

export { uploadRoutes };
