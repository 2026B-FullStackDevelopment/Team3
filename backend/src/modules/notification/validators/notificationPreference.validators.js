import { ValidationError } from "../../../shared/errors/errors.js";
import {
  has,
  ensureNonEmpty,
  validateFoodCategories,
  validateIsVegetarian,
  validatePriceRange,
  validatePreferenceCity,
} from "../helpers/notificationPreference.helper.js";

/**
 * Create body — all fields required (SRS 5.3.1: each preference has categories,
 * vegetarian status, price range, city). Returns clean data.
 */
export function validateCreatePreference(body = {}) {
  const foodCategory = validateFoodCategories(body.foodCategory);
  const isVegetarian = validateIsVegetarian(body.isVegetarian);
  const { priceRangeMin, priceRangeMax } = validatePriceRange(
    body.priceRangeMin,
    body.priceRangeMax,
  );
  const city = validatePreferenceCity(body.city);
  return { foodCategory, isVegetarian, priceRangeMin, priceRangeMax, city };
}

/**
 * Partial update — only present editable keys. A price-range update must include
 * BOTH priceRangeMin and priceRangeMax (so min ≤ max is checkable without a
 * read-merge). Empty patch → 400.
 */
export function validateUpdatePreference(body = {}) {
  const patch = {};

  if (has(body, "foodCategory")) {
    patch.foodCategory = validateFoodCategories(body.foodCategory);
  }
  if (has(body, "isVegetarian")) {
    patch.isVegetarian = validateIsVegetarian(body.isVegetarian);
  }
  if (has(body, "priceRangeMin") || has(body, "priceRangeMax")) {
    if (!has(body, "priceRangeMin") || !has(body, "priceRangeMax")) {
      throw new ValidationError(
        "Updating the price range requires both priceRangeMin and priceRangeMax",
      );
    }
    const { priceRangeMin, priceRangeMax } = validatePriceRange(
      body.priceRangeMin,
      body.priceRangeMax,
    );
    patch.priceRangeMin = priceRangeMin;
    patch.priceRangeMax = priceRangeMax;
  }
  if (has(body, "city")) {
    patch.city = validatePreferenceCity(body.city);
  }

  return ensureNonEmpty(patch);
}
