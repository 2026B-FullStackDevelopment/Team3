import { MeasurementUnit, DonationStatus } from "../models/donation.model.js";
import { FoodCategory } from "../../../shared/constants/foodCategory.js";
import { ValidationError } from "../../../shared/errors/errors.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const VALID_MEASUREMENT_UNIT = Object.values(MeasurementUnit);
const VALID_STATUSES = Object.values(DonationStatus);
const VALID_FOOD_CATEGORY = Object.values(FoodCategory);
const DONOR_SORT_FIELDS = ["createdAt", "revenue"];
const RECIPIENT_SORT_FIELDS = ["createdAt", "price"];
const VALID_SORT_ORDERS = ["asc", "desc"];

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function requireNonEmptyString(value, fieldName) {
  if (!isNonEmptyString(value)) {
    throw new ValidationError(`${fieldName} is required`);
  }
  return value.trim();
}

export function optionalString(value, fieldName) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  return value.trim();
}

export function optionalNullableBoolean(value, fieldName) {
  if (value === undefined || value === null || value === "") return value;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  if (value === "null") return null;
  throw new ValidationError(`${fieldName} must be true, false or null`);
}

export function requireNonNegativeNumber(value, fieldName) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new ValidationError(`${fieldName} must be a non-negative number`);
  }
  return number;
}

export function requireListingPrice(value) {
  const price = Number(value);
  if (
    !Number.isFinite(price) ||
    (price !== 0 && (!Number.isInteger(price) || price <= 1000))
  ) {
    throw new ValidationError(
      "price must be free (0) or an integer greater than 1000 VND",
    );
  }
  return price;
}

export function requirePositiveNumber(value, fieldName) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new ValidationError(`${fieldName} must be greater than 0`);
  }
  return number;
}

export function validateEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(",")}`,
    );
  }
  return value;
}

export function normalizePage(value) {
  if (value === undefined) return DEFAULT_PAGE;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError("page must be a positive integer");
  }
  return page;
}

export function normalizeLimit(value) {
  if (value === undefined) return DEFAULT_LIMIT;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new ValidationError("limit must be a positive integer");
  }
  return Math.min(limit, MAX_LIMIT);
}

function normalizeDate(value, fieldName, endOfDay = false) {
  if (value === undefined) return undefined;
  const rawValue = optionalString(value, fieldName);
  if (rawValue === "") return undefined;
  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`);
  }
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

function normalizeSortBy(value, allowedFields = DONOR_SORT_FIELDS) {
  if (value === undefined || value === "") return "createdAt";
  return validateEnum(optionalString(value, "sortBy"), allowedFields, "sortBy");
}

function normalizeSortOrder(value) {
  if (value === undefined || value === "") return "desc";
  return validateEnum(
    optionalString(value, "sortOrder").toLowerCase(),
    VALID_SORT_ORDERS,
    "sortOrder",
  );
}

function buildSort(sortBy, sortOrder) {
  return { [sortBy]: sortOrder === "asc" ? 1 : -1 };
}

export function normalizeListingQuery(filters = {}, options = {}) {
  const sortBy = normalizeSortBy(
    filters.sortBy,
    options.allowedSortFields ?? DONOR_SORT_FIELDS,
  );
  const sortOrder = normalizeSortOrder(filters.sortOrder);
  const createdFrom = normalizeDate(filters.createdFrom, "createdFrom");
  const createdTo = normalizeDate(filters.createdTo, "createdTo", true);
  if (
    createdFrom !== undefined &&
    createdTo !== undefined &&
    createdFrom > createdTo
  ) {
    throw new ValidationError("createdFrom cannot be after createdTo");
  }

  const normalizedFilters = {
    page: normalizePage(filters.page),
    limit: normalizeLimit(filters.limit),
    includeClosed: filters.includeClosed !== false,
    sortBy,
    sortOrder,
    sort: buildSort(sortBy, sortOrder),
  };
  if (createdFrom !== undefined) normalizedFilters.createdFrom = createdFrom;
  if (createdTo !== undefined) normalizedFilters.createdTo = createdTo;
  if (filters.status !== undefined) {
    normalizedFilters.status = validateEnum(
      filters.status,
      VALID_STATUSES,
      "status",
    );
  }
  if (filters.measurementUnit !== undefined) {
    normalizedFilters.measurementUnit = validateEnum(
      filters.measurementUnit,
      VALID_MEASUREMENT_UNIT,
      "measurementUnit",
    );
  }
  if (filters.foodCategory !== undefined) {
    normalizedFilters.foodCategory = validateEnum(
      filters.foodCategory,
      VALID_FOOD_CATEGORY,
      "foodCategory",
    );
  }
  if (filters.search !== undefined) {
    normalizedFilters.search = optionalString(filters.search, "search");
  }
  if (filters.isVegetarian !== undefined) {
    if (![true, false, "true", "false"].includes(filters.isVegetarian)) {
      throw new ValidationError("isVegetarian must be true or false");
    }
    normalizedFilters.isVegetarian =
      filters.isVegetarian === true || filters.isVegetarian === "true";
  }
  if (filters.minPrice !== undefined) {
    normalizedFilters.minPrice = requireNonNegativeNumber(
      filters.minPrice,
      "minPrice",
    );
  }
  if (filters.maxPrice !== undefined) {
    normalizedFilters.maxPrice = requireNonNegativeNumber(
      filters.maxPrice,
      "maxPrice",
    );
  }
  if (
    normalizedFilters.minPrice !== undefined &&
    normalizedFilters.maxPrice !== undefined &&
    normalizedFilters.minPrice > normalizedFilters.maxPrice
  ) {
    throw new ValidationError("minPrice cannot exceed maxPrice");
  }
  return normalizedFilters;
}

export function normalizeRecipientListingQuery(filters = {}) {
  const normalizedFilters = normalizeListingQuery(filters, {
    allowedSortFields: RECIPIENT_SORT_FIELDS,
  });
  normalizedFilters.includeClosed = false;
  if (filters.municipality !== undefined) {
    normalizedFilters.municipality = requireNonEmptyString(
      filters.municipality,
      "municipality",
    );
  }
  return normalizedFilters;
}

export const donationValidationValues = {
  measurementUnits: VALID_MEASUREMENT_UNIT,
  statuses: VALID_STATUSES,
  foodCategories: VALID_FOOD_CATEGORY,
};
