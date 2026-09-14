import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "../../../config/env.js";
import { ValidationError } from "../../errors/errors.js";

/**
 * Local filesystem storage for uploaded avatars. Owns where avatar files live
 * on disk and how they map to/from the public `/upload/avatars/...` URL stored
 * in Mongo. Consumers deal only in URLs; this module hides the raw `fs`/paths.
 *
 * Deployment note: this assumes a persistent, writable filesystem (a VM/
 * container with a volume, or local dev) — NOT a serverless host like Vercel
 * whose filesystem is ephemeral/read-only. See the profile section design spec.
 */

const AVATAR_SUBDIR = "avatars";
const AVATAR_URL_PREFIX = "/upload/avatars";

// Absolute directory avatar files are written to: <UPLOAD_DIR>/avatars.
export const AVATAR_DIR = path.join(env.upload.dir, AVATAR_SUBDIR);

/** Ensures the avatar directory exists. Call once at startup. */
export async function ensureUploadDirs() {
  await fs.mkdir(AVATAR_DIR, { recursive: true });
}

/** Public URL (stored in Mongo) for a stored avatar file. */
export function avatarUrlFor(filename) {
  return `${AVATAR_URL_PREFIX}/${filename}`;
}

// Every stored avatar is normalized to this square size for consistent display.
const AVATAR_SIZE = 256;

/**
 * Resizes an in-memory avatar to a fixed AVATAR_SIZE square (cover/crop),
 * re-encodes it, then writes the final file once (SRS 3.2.1). Avoiding an
 * immediate read/overwrite of the same file prevents Windows file-lock races.
 * Invalid image processing becomes a 400; storage failures remain server errors.
 */
export async function processAvatar(inputBuffer, filename, mime) {
  const format =
    mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpeg";
  let buffer;
  try {
    buffer = await sharp(inputBuffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
      .toFormat(format)
      .toBuffer();
  } catch {
    throw new ValidationError("Avatar image could not be processed");
  }

  const filePath = path.join(AVATAR_DIR, filename);
  try {
    await fs.writeFile(filePath, buffer, { flag: "wx" });
  } catch (error) {
    if (error?.code !== "EEXIST") {
      await fs.unlink(filePath).catch(() => {});
    }
    throw error;
  }
  return { path: filePath };
}

/**
 * Best-effort delete of a locally-stored avatar by its URL. No-ops for empty or
 * non-local URLs (only touches our `/upload/avatars/` files) and swallows a
 * missing file — cleanup must never fail the request that triggered it.
 * `path.basename` strips any directory portion so a crafted URL can't escape
 * AVATAR_DIR.
 */
export async function deleteAvatar(avatarUrl) {
  if (
    typeof avatarUrl !== "string" ||
    !avatarUrl.startsWith(`${AVATAR_URL_PREFIX}/`)
  ) {
    return;
  }
  const filename = path.basename(avatarUrl);
  try {
    await fs.unlink(path.join(AVATAR_DIR, filename));
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn("avatar cleanup failed:", error?.message);
    }
  }
}
