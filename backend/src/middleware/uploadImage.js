import { randomUUID } from "node:crypto";
import multer from "multer";
import { ValidationError } from "../shared/errors/errors.js";
import { putObject } from "../shared/upload/services/objectStore.js";
import {
  ALLOWED_IMAGE_MIMES,
  IMAGE_HEADER_BYTES,
  sniffImageMime,
} from "../shared/upload/validators/upload.js";

const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Builds single-image upload middleware. multer keeps the bounded file in memory,
 * we optionally verify its real content (magic bytes), then hand the buffer to
 * Cloudinary and expose the resulting secure_url as req.file.publicUrl. Replaces
 * the former avatar-specific and donation-specific middlewares.
 */
export function uploadImage({
  fieldName = "image",
  folder,
  maxBytes = DEFAULT_MAX_IMAGE_BYTES,
  required = false,
  sniffContent = false,
  transform = null,
  keyFor,
} = {}) {
  if (typeof folder !== "string" || !/^[a-zA-Z0-9_-]+$/.test(folder)) {
    throw new TypeError("uploadImage requires a safe folder name");
  }
  const buildKey = keyFor ?? (() => `${folder}/${Date.now()}-${randomUUID()}`);

  function fileFilter(_req, file, callback) {
    if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      return callback(
        new ValidationError("Image must be a JPEG, PNG or WebP file"),
      );
    }
    callback(null, true);
  }

  const runMulter = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: maxBytes, files: 1 },
  }).single(fieldName);

  return function uploadSingleImage(req, res, next) {
    runMulter(req, res, (error) => {
      if (error) {
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
          ? next(new ValidationError(`An '${fieldName}' image file is required`))
          : next();
      }

      Promise.resolve()
        .then(() => {
          if (sniffContent) {
            const detected = sniffImageMime(
              req.file.buffer.subarray(0, IMAGE_HEADER_BYTES),
            );
            if (!detected || !ALLOWED_IMAGE_MIMES.has(detected)) {
              throw new ValidationError(
                "File is not a valid JPEG, PNG or WebP image",
              );
            }
          }
          return putObject({
            key: buildKey(req),
            buffer: req.file.buffer,
            transform,
          });
        })
        .then(({ url }) => {
          req.file.publicUrl = url;
          delete req.file.buffer;
          next();
        })
        .catch(next);
    });
  };
}
