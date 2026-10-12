import "server-only";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

/**
 * Image storage adapter (local filesystem → public/uploads).
 *
 * PRODUCTION NOTE: serverless platforms (Vercel, Netlify, …) have a read-only,
 * ephemeral filesystem, so files written here would be lost or fail to write.
 * Before deploying, swap the bodies of `saveImage` / `deleteImage` for an object
 * store such as S3, Cloudflare R2 or Supabase Storage and return its public URL.
 * The rest of the admin only depends on these two functions.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const ALLOWED_IMAGE_TYPES = Object.keys(ALLOWED);

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PUBLIC_PREFIX = "/uploads/";

export class StorageError extends Error {}

/** Detects the real image type from the file signature (never trust the declared type alone). */
function sniff(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return "image/webp";
  if (buf.length >= 12 && buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  return null;
}

/** Validates and stores an uploaded image; returns its public URL (e.g. /uploads/<uuid>.jpg). */
export async function saveImage(file: File): Promise<string> {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) throw new StorageError("No file provided.");
  if (file.size > MAX_IMAGE_BYTES) throw new StorageError("Image is larger than 5 MB.");
  if (!ALLOWED[file.type]) throw new StorageError("Only JPEG, PNG, WebP or AVIF images are allowed.");
  const buf = Buffer.from(await file.arrayBuffer());
  const detected = sniff(buf);
  if (!detected) throw new StorageError("The file content is not a valid JPEG, PNG, WebP or AVIF image.");
  // The client-supplied filename is ignored entirely.
  const name = `${randomUUID()}.${ALLOWED[detected]}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  return `${PUBLIC_PREFIX}${name}`;
}

/** Deletes a previously uploaded image. URLs outside /uploads are ignored (seeded/static assets are never removed). */
export async function deleteImage(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith(PUBLIC_PREFIX)) return;
  const name = url.slice(PUBLIC_PREFIX.length);
  if (!/^[A-Za-z0-9-]+\.(jpg|png|webp|avif)$/.test(name)) return;
  const full = path.join(UPLOAD_DIR, name);
  if (path.dirname(full) !== UPLOAD_DIR) return;
  try {
    await unlink(full);
  } catch {
    // already gone
  }
}
