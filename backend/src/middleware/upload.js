import { open, unlink } from "node:fs/promises";
import multer from "multer";
import { ValidationError } from "../shared/errors/errors.js";
import { AVATAR_DIR } from "../shared/upload/services/storage.js";
import {
  ALLOWED_IMAGE_MIMES,
  MIME_EXTENSION,
  MAX_AVATAR_BYTES,
  IMAGE_HEADER_BYTES,
  sniffImageMime,
} from "../shared/upload/validators/upload.js";

/**
 * Avatar upload middleware. multer streams the file straight to disk
 * (diskStorage) under AVATAR_DIR with a server-generated, userId-namespaced
 * name; the extension comes from the (trusted) mimetype, never the client
 * filename. Mounted AFTER requireAuth so req.user.userId is available.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = MIME_EXTENSION[file.mimetype] ?? "bin";
    cb(null, `${req.user.userId}-${Date.now()}.${ext}`);
  },
});

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
 * Reads the stored file's leading bytes and rejects it (deleting the file) if
 * its actual content isn't a supported image — catching a non-image with a
 * spoofed image mimetype that slipped past the declared-mimetype filter.
 */
async function assertImageContent(file) {
  const header = Buffer.alloc(IMAGE_HEADER_BYTES);
  const fd = await open(file.path, "r");
  let bytesRead;
  try {
    ({ bytesRead } = await fd.read(header, 0, IMAGE_HEADER_BYTES, 0));
  } finally {
    await fd.close();
  }

  const detected = sniffImageMime(header.subarray(0, bytesRead));
  if (!detected || !ALLOWED_IMAGE_MIMES.has(detected)) {
    await unlink(file.path).catch(() => {});
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

    assertImageContent(req.file).then(() => next(), next);
  });
}
