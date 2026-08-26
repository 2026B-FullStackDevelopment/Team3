import {
  ensureNonEmpty,
  has,
  requireNonEmptyString,
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

  if (has(body, "userName")) {
    patch.userName = requireNonEmptyString(body.userName, "userName");
  }

  if (has(body, "city")) {
    patch.city = requireString(body.city, "city");
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

  if (has(body, "companyName")) {
    patch.companyName = validateCompanyName(body.companyName, "companyName");
  }
  if (has(body, "city")) {
    patch.city = requireNonEmptyString(body.city, "city");
  }
  if (has(body, "address")) {
    patch.address = requireString(body.address, "address");
  }
  if (has(body, "location")) {
    patch.location = validateLocation(body.location);
  }

  return ensureNonEmpty(patch);
}
