import { v2 as cloudinary } from "cloudinary";
import { env } from "../../../config/env.js";

/**
 * Cloudinary-only object storage port. Callers deal in a logical `key` (also the
 * Cloudinary public_id) and get back a public secure_url to persist in Mongo.
 * env.cloudinaryUrl is required at startup, so the SDK (which auto-reads
 * CLOUDINARY_URL) is always configured.
 */

// Touch env so a missing CLOUDINARY_URL fails fast at import time.
void env.cloudinaryUrl;
cloudinary.config({ secure: true });

/**
 * Uploads an in-memory image buffer. `transform` (when given) is applied as an
 * incoming transformation, so the STORED asset is the transformed one and its
 * secure_url delivers the resized image with no transform segment in the path.
 */
export function putObject({ key, buffer, transform }) {
  return new Promise((resolve, reject) => {
    const options = { public_id: key, resource_type: "image", overwrite: true };
    if (transform) options.transformation = transform;
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        return reject(error ?? new Error("Cloudinary upload failed"));
      }
      resolve({ url: result.secure_url });
    });
    stream.end(buffer);
  });
}

/**
 * Recovers the Cloudinary public_id from a stored secure_url: strips everything
 * through `/upload/`, a leading `v<digits>/` version segment, and the extension.
 */
export function parseCloudinaryPublicId(url) {
  if (typeof url !== "string") return null;
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  let rest = url.slice(idx + marker.length).replace(/^v\d+\//, "");
  rest = rest.replace(/\.[^./]+$/, "");
  return rest || null;
}

/** Best-effort delete of a stored asset by its secure_url. Never throws. */
export async function deleteObject(url) {
  const publicId = parseCloudinaryPublicId(url);
  if (!publicId) return;
  await cloudinary.uploader
    .destroy(publicId, { resource_type: "image" })
    .catch((error) => console.warn("cloudinary cleanup failed:", error?.message));
}
