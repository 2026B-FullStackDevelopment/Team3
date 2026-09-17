import "dotenv/config";

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
    sweepBatchSize: int("ADMIN_SWEEP_BATCH_SIZE", 50),
  },

  realtime: {
    corsOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    recoveryWindowMs: int("SOCKET_RECOVERY_WINDOW_MS", 2 * 60_000),
  },

  // Cloudinary connection string (cloudinary://<key>:<secret>@<cloud>). Required
  // in every environment — Cloudinary is the only image storage backend.
  // cloudinaryUrl: required("CLOUDINARY_URL"),

  mail: {
    // Resend API key. When unset, the mailer no-ops and logs a skip line, so
    // local dev runs without a key or any real sending.
    apiKey: process.env.RESEND_API_KEY,
    // Sender address. `onboarding@resend.dev` works before a domain is verified
    // (Resend then delivers only to your own account email). Swap to a
    // verified-domain sender via MAIL_FROM once DNS is set up.
    from: process.env.MAIL_FROM ?? "AFF <onboarding@resend.dev>",
  },

  stripe: {
    // Test-mode secret key. Together with webhookSecret it enables card
    // payments (e.g. premium via Stripe); when either is unset, card payment
    // endpoints return 409.
    secretKey: process.env.STRIPE_SECRET_KEY,
    // Webhook signing secret (whsec_...), required to verify webhook signatures.
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    // Base URL Stripe redirects back to after checkout. Vite dev default.
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  },
};
