import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { put, del } from '@vercel/blob';
import { env } from '../config/env.js';

/**
 * Blob storage abstraction (D-005). Vercel Blob is used when `BLOB_READ_WRITE_TOKEN` is set;
 * otherwise falls back to local disk under `BLOB_LOCAL_DIR` for development/tests. Callers never
 * see a raw blob URL — download access is always gated by minting a 60s JWT that resolves through
 * `GET /content/:contentId/blob` (see routes/content.route.ts), regardless of backend, so the
 * "signed URL" contract is uniform whether or not Vercel Blob is configured.
 *
 * `storageKey` is opaque to callers: `local:<sha256>` for disk, or the Vercel Blob URL for cloud.
 */

const LOCAL_PREFIX = 'local:';

function localDir(): string {
  return path.resolve(process.cwd(), env.BLOB_LOCAL_DIR);
}

function localPath(sha256: string): string {
  return path.join(localDir(), sha256);
}

export function usingVercelBlob(): boolean {
  return Boolean(env.BLOB_READ_WRITE_TOKEN);
}

export async function storeBlob(sha256: string, bytes: Buffer): Promise<{ storageKey: string }> {
  if (usingVercelBlob()) {
    const result = await put(sha256, bytes, {
      access: 'public',
      token: env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      contentType: 'application/pdf',
    });
    return { storageKey: result.url };
  }
  await mkdir(localDir(), { recursive: true });
  await writeFile(localPath(sha256), bytes);
  return { storageKey: `${LOCAL_PREFIX}${sha256}` };
}

export async function readBlob(storageKey: string): Promise<Buffer> {
  if (storageKey.startsWith(LOCAL_PREFIX)) {
    return readFile(localPath(storageKey.slice(LOCAL_PREFIX.length)));
  }
  // Vercel Blob URL.
  const res = await fetch(storageKey);
  if (!res.ok) {
    throw new Error(`Failed to fetch blob ${storageKey}: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function deleteBlob(storageKey: string): Promise<void> {
  if (storageKey.startsWith(LOCAL_PREFIX)) {
    await rm(localPath(storageKey.slice(LOCAL_PREFIX.length)), { force: true });
    return;
  }
  await del(storageKey, { token: env.BLOB_READ_WRITE_TOKEN });
}
