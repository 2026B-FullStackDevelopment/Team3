import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";

import { env } from "../config/env.js";
import { ValidationError } from "../shared/errors/errors.js";
import {
  ALLOWED_IMAGE_MIMES,
  MIME_EXTENSION,
} from "../shared/upload/validators/upload.js";

const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function requireSafeSubdirectory(value) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new TypeError(
      "imageUpload subdirectory must be a safe directory name",
    );
  }
  return value;
}

/**
 * Builds reusable single-image upload middleware for a public /upload subfolder.
 * The file is stored byte-for-byte: unlike avatarUpload, this intentionally does
 * not sniff, resize, crop, or re-encode the image, so its original quality remains.
 */
export function imageUpload({
  fieldName = "image",
  subdirectory = "images",
  required = false,
  maxBytes = DEFAULT_MAX_IMAGE_BYTES,
} = {}) {
  const safeSubdirectory = requireSafeSubdirectory(subdirectory);
  const destination = path.join(env.upload.dir, safeSubdirectory);

  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
      mkdir(destination, { recursive: true })
        .then(() => callback(null, destination))
        .catch(callback);
    },
    filename: (_req, file, callback) => {
      const extension = MIME_EXTENSION[file.mimetype] ?? "bin";
      callback(null, `${Date.now()}-${randomUUID()}.${extension}`);
    },
  });

  // Without content sniffing this checks only the client-declared MIME type.
  // That preserves the requested upload flow, but must not be treated as proof
  // that the stored bytes are a genuine image.
  function fileFilter(_req, file, callback) {
    if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      return callback(
        new ValidationError("Image must be a JPEG, PNG or WebP file"),
      );
    }
    callback(null, true);
  }

  const runMulter = multer({
    storage,
    fileFilter,
    limits: { fileSize: maxBytes, files: 1 },
  }).single(fieldName);

  return function uploadSingleImage(req, res, next) {
    runMulter(req, res, async (error) => {
      if (error) {
        // Multer can fail after accepting an earlier file (for example, when a
        // second unexpected file is sent), so remove any file already written.
        await removeUploadedImage(req.file);
        if (error instanceof multer.MulterError) {
          const message =
            error.code === "LIMIT_FILE_SIZE"
              ? `Image must be ${Math.floor(maxBytes / (1024 * 1024))} MB or smaller`
              : error.code === "LIMIT_FILE_COUNT" ||
                  error.code === "LIMIT_UNEXPECTED_FILE"
                ? `Upload exactly one image using the '${fieldName}' field`
                : `Upload error: ${error.message}`;
          return next(new ValidationError(message));
        }
        return next(error);
      }

      if (!req.file) {
        return required
          ? next(
              new ValidationError(`An '${fieldName}' image file is required`),
            )
          : next();
      }

      // Controllers/services persist this public URL instead of a filesystem path.
      req.file.publicUrl = `/upload/${safeSubdirectory}/${req.file.filename}`;
      next();
    });
  };
}

/** Best-effort cleanup when a later validation/database step rejects the upload. */
export async function removeUploadedImage(file) {
  if (!file?.path) return;
  await unlink(file.path).catch((error) => {
    if (error?.code !== "ENOENT") {
      console.warn("uploaded image cleanup failed:", error?.message);
    }
  });
}
