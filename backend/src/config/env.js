import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Backend root, resolved from this file (src/config/env.js) so upload paths
// don't depend on process.cwd().
const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)), // Give the URL of the current file.
  "../..",
);

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing`);
  }
  return value;
}

function int(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be an integer`);
  }
  return parsed;
}

export const env = {
  dbUri: required("MONGODB_URI"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",

  jwt: {
    secret: required("JWT_SECRET"),
    // jsonwebtoken accepts a zeit/ms string (e.g. "1h") for expiresIn.
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  },

  cookie: {
    name: process.env.COOKIE_NAME ?? "aff_token",
  },

  auth: {
    lockoutThreshold: int("LOCKOUT_THRESHOLD", 5),
    lockoutDurationMs: int("LOCKOUT_DURATION_MS", 60_000),
    bcryptRounds: int("BCRYPT_ROUNDS", 12),
  },

  admin: {
    // Window an Admin has to undo a Deactivate/Reactivate/Cancel action
    // before the audit log entry finalizes (see AuditLog.undoDeadline).
    undoWindowMs: int("ADMIN_UNDO_WINDOW_MS", 10 * 60_000),
    // How often the sweep job checks for Pending entries past their
    // undoDeadline (see jobs/auditLogSweep.job.js).
    sweepIntervalMs: int("ADMIN_SWEEP_INTERVAL_MS", 60_000),
  },

  upload: {
    // Absolute path where uploaded images are stored, referenced by URL in Mongo.
    // Defaults to <backend>/upload; override with UPLOAD_DIR (relative values are
    // resolved against the backend root).
    dir: process.env.UPLOAD_DIR
      ? path.resolve(backendRoot, process.env.UPLOAD_DIR)
      : path.join(backendRoot, "upload"),
  },
};
