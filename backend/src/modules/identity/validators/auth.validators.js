import { userRole } from "../models/User.js";
import { ValidationError } from "../../../shared/errors/errors.js";

// Public self-registration is for Donor and Recipient only; Admin accounts are
// provisioned out-of-band, never via this endpoint.
const REGISTRABLE_ROLES = [userRole.Recipient, userRole.Donor];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength: >=8 chars, >=1 digit, >=1 special char, >=1 uppercase.
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_RULES = [
  { test: (pw) => pw.length >= MIN_PASSWORD_LENGTH, label: "at least 8 characters" },
  { test: (pw) => /[0-9]/.test(pw), label: "at least 1 number" },
  { test: (pw) => /[^A-Za-z0-9]/.test(pw), label: "at least 1 special character" },
  { test: (pw) => /[A-Z]/.test(pw), label: "at least 1 uppercase letter" },
];

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Validates + normalizes a registration request body. Returns a clean input
 * object (email lowercased, role-specific profile fields separated) or throws
 * ValidationError. Controllers call this before touching the service.
 */
export function validateRegister(body = {}) {
  const email = asString(body.email).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new ValidationError("A valid email is required");
  }

  const password = typeof body.password === "string" ? body.password : "";
  const unmet = PASSWORD_RULES.filter((rule) => !rule.test(password));
  if (unmet.length > 0) {
    throw new ValidationError(
      `Password must contain ${unmet.map((rule) => rule.label).join(", ")}`,
    );
  }

  const role = asString(body.role);
  if (!REGISTRABLE_ROLES.includes(role)) {
    throw new ValidationError("Role must be either Recipient or Donor");
  }

  const profile =
    role === userRole.Recipient
      ? validateRecipientProfile(body)
      : validateDonorProfile(body);

  return { email, password, role, profile };
}

/**
 * Validates + normalizes a login request body. Only checks presence/shape —
 * credential correctness (and the generic failure response) is the service's
 * job. No password-strength checks here; that gates registration, not login.
 */
export function validateLogin(body = {}) {
  const email = asString(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }
  return { email, password };
}

function validateRecipientProfile(body) {
  const userName = asString(body.userName);
  if (!userName) {
    throw new ValidationError("userName is required for a Recipient");
  }
  return {
    userName,
    city: asString(body.city) || undefined,
  };
}

// Tax Code must be 10 to 13 digits.
const TAX_CODE_RE = /^\d{10,13}$/;

function validateDonorProfile(body) {
  const taxCode = asString(body.taxCode);
  if (!taxCode) {
    throw new ValidationError("taxCode is required for a Donor");
  }
  if (!TAX_CODE_RE.test(taxCode)) {
    throw new ValidationError("taxCode must contain 10 to 13 digits");
  }

  const coordinates = body.location?.coordinates;
  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    !coordinates.every((n) => typeof n === "number" && Number.isFinite(n))
  ) {
    throw new ValidationError(
      "location.coordinates must be [longitude, latitude] numbers",
    );
  }

  return {
    taxCode,
    location: { type: "Point", coordinates },
    companyName: asString(body.companyName) || undefined,
    city: asString(body.city) || undefined,
    address: asString(body.address) || undefined,
  };
}
