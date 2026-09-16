import { userRole } from "../models/User.js";
import { ValidationError } from "../../../shared/errors/errors.js";
import { isVietnamCity } from "../../../shared/constants/vietnamCities.js";
import {
  optionalString,
  requireNonEmptyString,
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
const EMAIL_MAX_LENGTH = 255;
const PROHIBITED_EMAIL_CHARS = ["(", ")", ";", ":"];

// Tax Code must be 10 to 13 digits.
const TAX_CODE_RE = /^\d{10,13}$/;

// Username: English letters, digits, underscore and hyphen only (SRS 1A.2.3).
const USERNAME_RE = /^[A-Za-z0-9_-]+$/;

/**
 * Validates an email and returns it lowercased (SRS 1A.2.2 / 1B.2.2): well-formed
 * (one '@', a '.' after it, no spaces), under 255 chars, and free of the
 * prohibited characters ( ) ; : .
 */
export function validateEmail(value) {
  const email = requireNonEmptyString(value, "email").toLowerCase();
  if (email.length >= EMAIL_MAX_LENGTH) {
    throw new ValidationError("email must be shorter than 255 characters");
  }
  if (PROHIBITED_EMAIL_CHARS.some((ch) => email.includes(ch))) {
    throw new ValidationError(
      "email must not contain the characters ( ) ; : — e.g. jane.doe@example.com",
    );
  }
  if (!EMAIL_RE.test(email)) {
    throw new ValidationError(
      "A valid email is required — e.g. jane.doe@example.com",
    );
  }
  return email;
}

/** Validates username syntax (SRS 1A.2.3): non-empty, letters/digits/underscore/hyphen only. */
export function validateUserName(value) {
  const userName = requireNonEmptyString(value, "userName");
  if (!USERNAME_RE.test(userName)) {
    throw new ValidationError(
      "userName may contain only English letters, numbers, underscore (_) and hyphen (-) — e.g. jane_doe-01",
    );
  }
  return userName;
}

/** Validates that city is a known Vietnamese province/municipality (SRS 1A.1.4 / 1B.1.4). */
export function validateCity(value) {
  const city = requireNonEmptyString(value, "city");
  if (!isVietnamCity(city)) {
    throw new ValidationError(
      "city must be a valid Vietnamese province/municipality — e.g. Ho Chi Minh City",
    );
  }
  return city;
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

/** Builds the Recipient profile sub-object. userName + city required and syntax-checked. */
export function validateRecipientProfile(body) {
  return {
    userName: validateUserName(body.userName),
    city: validateCity(body.city),
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
    city: validateCity(body.city),
    address: optionalString(body.address, "address"),
  };
}
