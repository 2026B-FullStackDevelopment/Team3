import { userRole } from "../models/User.js";
import { ValidationError } from "../../../shared/errors/errors.js";
import {
  optionalString,
  requireNonEmptyString,
  requireString,
  validateCompanyName,
  validateLocation,
} from "./validators.helper.js";

/**
 * Auth-domain field validators. Each validates + normalizes a single piece of a
 * registration body and throws ValidationError on bad input. The orchestration
 * (which fields a register/login request needs, in what order) stays in
 * auth.validators.js; the domain rules (email shape, password strength, tax-code
 * format, per-role profile shape) live here so they can be managed in one place.
 */

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

// Tax Code must be 10 to 13 digits.
const TAX_CODE_RE = /^\d{10,13}$/;

/** Validates an email and returns it lowercased. Must be a non-empty, well-formed address. */
export function validateEmail(value) {
  const email = requireNonEmptyString(value, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new ValidationError("A valid email is required");
  }
  return email;
}

/**
 * Validates password strength and returns the password unchanged. Deliberately
 * does NOT trim — leading/trailing spaces are significant password characters,
 * so trimming here would silently alter what the user typed and desync register
 * from login. The length rule already rejects an empty password.
 */
export function validatePassword(value) {
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

/** Validates the requested role is one a member may self-register as. */
export function validateRole(value) {
  const role = requireNonEmptyString(value, "role");
  if (!REGISTRABLE_ROLES.includes(role)) {
    throw new ValidationError("Role must be either Recipient or Donor");
  }
  return role;
}

/** Validates a donor tax code: a non-empty string of 10 to 13 digits. */
export function validateTaxCode(value) {
  const taxCode = requireNonEmptyString(value, "taxCode");
  if (!TAX_CODE_RE.test(taxCode)) {
    throw new ValidationError("taxCode must contain 10 to 13 digits");
  }
  return taxCode;
}

/** Builds the Recipient profile sub-object. userName required; city optional. */
export function validateRecipientProfile(body) {
  return {
    userName: requireNonEmptyString(body.userName, "userName"),
    city: requireString(body.city, "city"),
  };
}

/**
 * Builds the Donor profile sub-object. taxCode, companyName, location and city
 * required; address optional. companyName syntax is Vietnamese letters, digits,
 * spaces and hyphens (see validateCompanyName).
 */
export function validateDonorProfile(body) {
  return {
    taxCode: validateTaxCode(body.taxCode),
    location: validateLocation(body.location),
    companyName: validateCompanyName(body.companyName, "companyName"),
    city: requireString(body.city, "city"),
    address: optionalString(body.address, "address"),
  };
}
