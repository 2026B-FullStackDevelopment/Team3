import { ValidationError } from "../../../shared/errors/errors.js";

/**
 * Shared validation boilerplate used across the identity validators
 * (auth + profile). Keep these generic and side-effect free — anything
 * domain-specific (password rules, tax-code format, editable-field lists)
 * stays in the validator that owns it.
 */

/** True if `body` has its own `key` (present in the request, even if falsy). */
export function has(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

/** Trims a value to a string, or "" when it isn't a string. */
export function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Asserts `value` is a string and returns it trimmed. A non-string (number,
 * boolean, null, object) is a client type error and is rejected as such —
 * never silently coerced to "". `field` names the offending key in the message.
 */
export function requireString(value, field) {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string`);
  }
  return value.trim();
}

/** As `requireString`, but also rejects an empty/whitespace-only result. */
export function requireNonEmptyString(value, field) {
  const trimmed = requireString(value, field);
  if (!trimmed) {
    throw new ValidationError(`${field} must not be empty`);
  }
  return trimmed;
}

/**
 * For optional string fields: an absent field (undefined/null) is omitted, an
 * empty string collapses to `undefined`, and any non-string is a type error —
 * never silently dropped. Used for registration's optional profile fields.
 */
export function optionalString(value, field) {
  if (value === undefined || value === null) {
    return undefined;
  }
  return requireString(value, field) || undefined;
}

/** Rejects an empty partial-update patch so a no-op surfaces as a clear 400. */
export function ensureNonEmpty(patch) {
  if (Object.keys(patch).length === 0) {
    throw new ValidationError("No updatable fields available");
  }
  return patch;
}

// Company name syntax: Vietnamese letters (with diacritics), digits, spaces and
// hyphens only. Enumerated rather than a À-ỹ range so stray symbols in
// that block (× ÷) and non-Vietnamese Latin letters can't slip through.
const COMPANY_NAME_RE =
  /^[a-zA-Z0-9 àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ-]+$/u;

/**
 * Validates company-name syntax and returns the trimmed value. Requires a
 * non-empty string containing only Vietnamese letters, digits, spaces and
 * hyphens. Shared by registration and donor profile updates so the rule can't
 * drift between the two write paths.
 */
export function validateCompanyName(value, field = "companyName") {
  const name = requireNonEmptyString(value, field);
  if (!COMPANY_NAME_RE.test(name)) {
    throw new ValidationError(
      `${field} may contain only Vietnamese letters, numbers, spaces and hyphens`,
    );
  }
  return name;
}

/**
 * Validates a location input and returns a normalized GeoJSON Point.
 * coordinates must be [longitude, latitude] finite numbers. Shared by
 * registration and donor profile updates so the shape can't drift.
 */
export function validateLocation(location) {
  const coordinates = location?.coordinates;
  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    !coordinates.every((n) => typeof n === "number" && Number.isFinite(n))
  ) {
    throw new ValidationError(
      "location.coordinates must be [longitude, latitude] numbers",
    );
  }
  return { type: "Point", coordinates };
}
