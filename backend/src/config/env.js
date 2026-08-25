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
};
