/**
 * Shared upload constraints for image uploads. Kept here so the multer file
 * filter, the size limit, and the extension mapping have one source of truth.
 */

// Raster image types only — no SVG (script-injection vector).
export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// Extension is derived from the (trusted) mimetype, never from the client
// filename, so a spoofed filename can't inject a path or a dangerous extension.
export const MIME_EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// 2 MB cap for an avatar.
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB = 2048 KB ( 1 KB = 1024 Bytes )

// Number of leading bytes needed to identify all supported image types (WebP
// needs 12: "RIFF"???? "WEBP").
export const IMAGE_HEADER_BYTES = 12;

/**
 * Identifies an image type from its leading bytes (magic number), independent of
 * the client-declared mimetype or filename. Returns the detected mime, or null
 * if the content isn't one of the supported image types. This is real content
 * validation: a non-image (e.g. a PDF) with a spoofed image mimetype is caught
 * here even though it passes the declared-mimetype filter.
 */
export function sniffImageMime(bytes) {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  // WebP: "RIFF" (0-3) .... "WEBP" (8-11)
  if (
    bytes.length >= 12 &&
    bytes.toString("latin1", 0, 4) === "RIFF" &&
    bytes.toString("latin1", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}
