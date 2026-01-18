// R2 Storage utilities
// Uncomment Bindings.STORAGE in types/app.ts and wrangler.toml to use

export interface UploadResult {
  key: string;
  size: number;
  etag: string;
  url: string;
}

export interface StorageService {
  upload(key: string, data: ReadableStream | ArrayBuffer | string, contentType?: string): Promise<UploadResult>;
  download(key: string): Promise<{ data: ReadableStream; contentType: string } | null>;
  delete(key: string): Promise<boolean>;
  list(prefix?: string, limit?: number): Promise<string[]>;
  getSignedUrl(key: string, expiresIn?: number): string;
}

export function createStorageService(bucket: R2Bucket, publicUrl?: string): StorageService {
  return {
    async upload(key, data, contentType = "application/octet-stream") {
      const result = await bucket.put(key, data, {
        httpMetadata: { contentType },
      });

      return {
        key,
        size: result?.size ?? 0,
        etag: result?.etag ?? "",
        url: publicUrl ? `${publicUrl}/${key}` : key,
      };
    },

    async download(key) {
      const object = await bucket.get(key);
      if (!object) return null;

      return {
        data: object.body,
        contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
      };
    },

    async delete(key) {
      await bucket.delete(key);
      return true;
    },

    async list(prefix = "", limit = 100) {
      const listed = await bucket.list({ prefix, limit });
      return listed.objects.map((obj) => obj.key);
    },

    getSignedUrl(key, _expiresIn = 3600) {
      // R2 doesn't have native signed URLs like S3
      // Use public bucket URL or implement custom signing
      return publicUrl ? `${publicUrl}/${key}` : key;
    },
  };
}

// Example usage in a route:
//
// import { createStorageService } from "../lib/storage";
//
// app.post("/upload", async (c) => {
//   const storage = createStorageService(c.env.STORAGE, "https://pub-xxx.r2.dev");
//   const file = await c.req.blob();
//   const result = await storage.upload(`uploads/${Date.now()}`, file.stream());
//   return c.json(result);
// });
