import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { StorageService, UploadResult } from "./storage";

/**
 * Local filesystem storage service for development
 *
 * Implements the same StorageService interface as R2,
 * allowing seamless switching between local and cloud storage.
 */
export function createLocalStorageService(
  basePath: string,
  publicUrl?: string
): StorageService {
  // Resolve to absolute path
  const storagePath = path.resolve(basePath);

  return {
    async upload(
      key: string,
      data: ReadableStream | ArrayBuffer | string,
      contentType = "application/octet-stream"
    ): Promise<UploadResult> {
      const filePath = path.join(storagePath, key);
      const dirPath = path.dirname(filePath);

      // Ensure directory exists
      await fs.mkdir(dirPath, { recursive: true });

      // Convert data to Buffer
      let buffer: Buffer;
      if (data instanceof ArrayBuffer) {
        buffer = Buffer.from(data);
      } else if (typeof data === "string") {
        buffer = Buffer.from(data);
      } else {
        // ReadableStream
        const chunks: Uint8Array[] = [];
        const reader = data.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        buffer = Buffer.concat(chunks);
      }

      // Write file
      await fs.writeFile(filePath, buffer);

      // Write metadata file for content-type
      const metaPath = `${filePath}.meta.json`;
      await fs.writeFile(
        metaPath,
        JSON.stringify({ contentType, size: buffer.length })
      );

      return {
        key,
        size: buffer.length,
        etag: `"${Date.now()}"`, // Simple etag for local
        url: publicUrl ? `${publicUrl}/${key}` : `/api/files/${key}`,
      };
    },

    async download(
      key: string
    ): Promise<{ data: ReadableStream; contentType: string } | null> {
      const filePath = path.join(storagePath, key);

      try {
        await fs.access(filePath);
      } catch {
        return null;
      }

      // Read metadata
      let contentType = "application/octet-stream";
      try {
        const metaPath = `${filePath}.meta.json`;
        const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
        contentType = meta.contentType || contentType;
      } catch {
        // No metadata file, use default
      }

      // Create ReadableStream from file
      const fileHandle = await fs.open(filePath, "r");
      const stream = fileHandle.readableWebStream() as ReadableStream;

      return { data: stream, contentType };
    },

    async delete(key: string): Promise<boolean> {
      const filePath = path.join(storagePath, key);
      const metaPath = `${filePath}.meta.json`;

      try {
        await fs.unlink(filePath);
        // Also delete metadata file if exists
        try {
          await fs.unlink(metaPath);
        } catch {
          // Ignore if meta doesn't exist
        }
        return true;
      } catch {
        return false;
      }
    },

    async list(prefix = "", limit = 100): Promise<string[]> {
      const searchPath = path.join(storagePath, prefix);
      const results: string[] = [];

      async function walkDir(dir: string): Promise<void> {
        if (results.length >= limit) return;

        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });

          for (const entry of entries) {
            if (results.length >= limit) break;

            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
              await walkDir(fullPath);
            } else if (!entry.name.endsWith(".meta.json")) {
              // Skip metadata files
              const relativePath = path.relative(storagePath, fullPath);
              results.push(relativePath);
            }
          }
        } catch {
          // Directory doesn't exist or not readable
        }
      }

      await walkDir(searchPath);
      return results.slice(0, limit);
    },

    getSignedUrl(key: string, _expiresIn = 3600): string {
      // Local storage doesn't support signed URLs
      // Return direct URL instead
      return publicUrl ? `${publicUrl}/${key}` : `/api/files/${key}`;
    },
  };
}
