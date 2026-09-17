import { ValidationError } from "../../../shared/errors/errors.js";
import { isVietnamCity } from "../../../shared/constants/vietnamCities.js";
import { FoodCategory } from "../../../shared/constants/foodCategory.js";

const CATEGORIES = Object.values(FoodCategory);

/** True if `body` has its own `key` (present in the request, even if falsy). */
export function has(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

/** Rejects an empty partial-update patch so a no-op PATCH is a clear 400. */
export function ensureNonEmpty(patch) {
  if (Object.keys(patch).length === 0) {
    throw new ValidationError("No updatable fields provided");
  }
  return patch;
}

/** Non-empty array whose every value is one of the six categories. */
export function validateFoodCategories(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError(
      'foodCategory must be a non-empty array of categories — e.g. ["Fruit", "Vegetable"]',
    );
  }
  for (const c of value) {
    if (!CATEGORIES.includes(c)) {
      throw new ValidationError(
        `foodCategory contains an invalid value "${c}" — allowed: ${CATEGORIES.join(", ")}`,
      );
    }
  }
  return value;
}

/** null means any dietary status; booleans request an exact status. */
export function validateIsVegetarian(value) {
  if (value !== null && typeof value !== "boolean") {
    throw new ValidationError(
      "isVegetarian must be true, false, or null for any status",
    );
  }
  return value;
}

/** Both integers ≥ 0 with min ≤ max. Returns { priceRangeMin, priceRangeMax }. */
export function validatePriceRange(min, max) {
  if (!Number.isInteger(min) || min < 0) {
    throw new ValidationError("priceRangeMin must be an integer ≥ 0 — e.g. 0");
  }
  if (!Number.isInteger(max) || max < 0) {
    throw new ValidationError(
      "priceRangeMax must be an integer ≥ 0 — e.g. 20000",
    );
  }
  if (min > max) {
    throw new ValidationError("priceRangeMin must not exceed priceRangeMax");
  }
  return { priceRangeMin: min, priceRangeMax: max };
}

/** city must be a supported Vietnamese city/municipality. */
export function validatePreferenceCity(value) {
  if (typeof value !== "string" || !isVietnamCity(value)) {
    throw new ValidationError(
      "city must be a Vietnamese city/municipality — e.g. Ho Chi Minh City",
    );
  }
  return value;
}

/** Order-insensitive equality of two category arrays. */
export function sameCategorySet(a = [], b = []) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((value, i) => value === sb[i]);
}

/**
 * True when two preferences are the same on every field (categories compared
 * order-insensitively) — i.e. a true duplicate that adds nothing.
 */
export function isSamePreference(x, y) {
  return (
    sameCategorySet(x.foodCategory, y.foodCategory) &&
    x.isVegetarian === y.isVegetarian &&
    x.priceRangeMin === y.priceRangeMin &&
    x.priceRangeMax === y.priceRangeMax &&
    x.city === y.city
  );
}
