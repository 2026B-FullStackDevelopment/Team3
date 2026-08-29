import bcrypt from "bcrypt";
import { env } from "../../../config/env.js";
import { ValidationError } from "../../../shared/errors/errors.js";

/**
 * Single source of truth for password concerns in the Identity module: strength
 * rules + bcrypt hashing/verification. Shared by registration and the profile
 * change-password flow so the rules and hashing parameters can't drift between
 * the two write paths.
 */

// Password strength: >=8 chars, >=1 digit, >=1 special char, >=1 uppercase.
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_RULES = [
  { test: (pw) => pw.length >= MIN_PASSWORD_LENGTH, label: "at least 8 characters" },
  { test: (pw) => /[0-9]/.test(pw), label: "at least 1 number" },
  { test: (pw) => /[^A-Za-z0-9]/.test(pw), label: "at least 1 special character" },
  { test: (pw) => /[A-Z]/.test(pw), label: "at least 1 uppercase letter" },
];

/**
 * Validates password strength and returns the password unchanged. Deliberately
 * does NOT trim — leading/trailing spaces are significant password characters,
 * so trimming here would silently alter what the user typed and desync register
 * from login. The length rule already rejects an empty password.
 */
export function validateStrength(value) {
  if (typeof value !== "string") {
    throw new ValidationError("password must be a string");
  }
  const unmet = PASSWORD_RULES.filter((rule) => !rule.test(value));
  if (unmet.length > 0) {
    throw new ValidationError(
      `Password must contain ${unmet.map((rule) => rule.label).join(", ")}`,
    );
  }
  return value;
}

/** Hashes a plaintext password with the configured bcrypt cost. */
export function hash(password) {
  return bcrypt.hash(password, env.auth.bcryptRounds);
}

/** Verifies a plaintext password against a stored bcrypt hash. */
export function verify(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
