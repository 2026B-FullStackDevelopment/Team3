import { randomUUID } from "node:crypto";
import multer from "multer";
import { ValidationError } from "../shared/errors/errors.js";
import { processAvatar } from "../shared/upload/services/storage.js";
import {
  ALLOWED_IMAGE_MIMES,
  MIME_EXTENSION,
  MAX_AVATAR_BYTES,
  IMAGE_HEADER_BYTES,
  sniffImageMime,
} from "../shared/upload/validators/upload.js";

/**
 * Avatar upload middleware. multer keeps the bounded upload in memory so Sharp
 * never has to read and immediately overwrite the same file on Windows. The
 * processed image is written to disk once with a server-generated,
 * userId-namespaced name. Mounted AFTER requireAuth so req.user.userId exists.
 */
const storage = multer.memoryStorage();

// Cheap first gate on the client-supplied mimetype. Rejecting with a
// ValidationError (a DomainError) means a bad type surfaces as a clean 400.
function fileFilter(_req, file, cb) {
  if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
    return cb(new ValidationError("Avatar must be a JPEG, PNG or WebP image"));
  }
  cb(null, true);
}

const runMulter = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
}).single("avatar");

/**
 * Reads the in-memory upload's leading bytes and rejects it if its actual
 * content isn't a supported image, catching a spoofed declared mimetype.
 */
async function assertImageContent(file) {
  const detected = sniffImageMime(file.buffer.subarray(0, IMAGE_HEADER_BYTES));
  if (!detected || !ALLOWED_IMAGE_MIMES.has(detected)) {
    throw new ValidationError(
      "Avatar file is not a valid JPEG, PNG or WebP image",
    );
  }
}

/**
 * Wraps the multer middleware so its own limit errors (a MulterError, which is
 * NOT a DomainError and would otherwise become a 500) are mapped to a 400. A
 * ValidationError thrown by the fileFilter passes straight through. After a
 * successful parse the stored file's real content is verified (magic bytes).
 */
export function avatarUpload(req, res, next) {
  runMulter(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? "Avatar must be 2 MB or smaller"
            : err.code === "LIMIT_FILE_COUNT"
              ? "Only one avatar file may be uploaded"
              : `Upload error: ${err.message}`;
        return next(new ValidationError(message));
      }
      return next(err);
    }

    if (!req.file) {
      return next(); // controller handles the no-file case
    }

    const ext = MIME_EXTENSION[req.file.mimetype] ?? "bin";
    const filename = `${req.user.userId}-${randomUUID()}.${ext}`;

    assertImageContent(req.file)
      .then(() => processAvatar(req.file.buffer, filename, req.file.mimetype))
      .then(({ path }) => {
        req.file.filename = filename;
        req.file.path = path;
        delete req.file.buffer;
        next();
      })
      .catch(next);
  });
}
