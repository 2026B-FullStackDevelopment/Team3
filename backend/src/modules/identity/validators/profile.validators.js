import { ValidationError } from "../../../shared/errors/errors.js";
import { validateStrength } from "../helpers/password.helper.js";
import {
  validateCity,
  validateEmail,
  validateUserName,
} from "../helpers/auth.helper.js";
import {
  ensureNonEmpty,
  has,
  requireString,
  validateCompanyName,
  validateLocation,
} from "../helpers/validators.helper.js";

// Partial-update validators. Each returns a patch object containing ONLY the
// editable keys actually present in the request body — never `$set: undefined`
// from an absent field. Immutable/unknown fields (email, taxCode, role, …) are
// silently ignored. An empty patch (no editable field supplied) is rejected so
// a no-op PATCH surfaces as a clear 400 rather than a silent success.

/**
 * Recipient editable fields: userName, city. userName (if present) must be a
 * non-empty string; uniqueness is enforced by the index (E11000 → Conflict in
 * the service), not here.
 */
export function validateRecipientProfileUpdate(body = {}) {
  const patch = {};

  if (has(body, "email")) {
    patch.email = validateEmail(body.email);
  }
  if (has(body, "userName")) {
    patch.userName = validateUserName(body.userName);
  }
  if (has(body, "city")) {
    patch.city = validateCity(body.city);
  }

  return ensureNonEmpty(patch);
}

/**
 * Donor editable fields: companyName, city, address, location. When location is
 * present its coordinates must be [longitude, latitude] finite numbers; the
 * full GeoJSON Point is reconstructed so the 2dsphere index stays valid.
 */
export function validateDonorProfileUpdate(body = {}) {
  const patch = {};

  if (has(body, "email")) {
    patch.email = validateEmail(body.email);
  }
  if (has(body, "companyName")) {
    patch.companyName = validateCompanyName(body.companyName, "companyName");
  }
  if (has(body, "city")) {
    patch.city = validateCity(body.city);
  }
  if (has(body, "address")) {
    patch.address = requireString(body.address, "address");
  }
  if (has(body, "location")) {
    patch.location = validateLocation(body.location);
  }

  return ensureNonEmpty(patch);
}

/**
 * Change-password body: { currentPassword, newPassword }. currentPassword is a
 * presence check only (no strength rules on the old one) and is NOT trimmed —
 * spaces are significant, and it is compared against the stored hash as-is.
 * newPassword must pass the shared strength rules. The "new must differ from
 * current" check lives in the service, where the current password is verified.
 */
export function validateChangePassword(body = {}) {
  const { currentPassword, newPassword } = body;

  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    throw new ValidationError("currentPassword is required");
  }

  validateStrength(newPassword);

  return { currentPassword, newPassword };
}
