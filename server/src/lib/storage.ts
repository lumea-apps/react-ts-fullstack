import { createLocalStorageService } from "./storage-local";
import type { Bindings } from "../types/app";

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

/**
 * Get storage service based on environment
 *
 * - Production (Workers): Uses R2 bucket
 * - Development (Node.js): Uses local filesystem
 */
export function getStorageService(env: Bindings): StorageService {
  // R2 available? Use R2
  if (env.STORAGE) {
    return createR2StorageService(env.STORAGE, env.R2_PUBLIC_URL);
  }

  // Fallback to local filesystem
  const storagePath = process.env.STORAGE_PATH || "./storage";
  return createLocalStorageService(storagePath);
}

/**
 * Create R2 storage service (production)
 */
export function createR2StorageService(bucket: R2Bucket, publicUrl?: string): StorageService {
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

