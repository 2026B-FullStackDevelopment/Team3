import * as donationRepository from "../repositories/donorListingRepository.js";
import * as reservationRepository from "../../reservation/repositories/reservationRepository.js";
import {
  allowsOnlineReservationForMeasurementUnit,
  MeasurementUnit,
  PerRequestDonationWarning,
  DonationStatus,
  DonationSchema,
} from "../models/donation.js";
import {
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/errors.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const VALID_MEASUREMENT_UNIT = Object.values(MeasurementUnit);
const VALID_STATUSES = Object.values(DonationStatus);
const VALID_FOOD_CATEGORY = DonationSchema.foodCategory.enum;
const VALID_SORT_FIELDS = ["createdAt", "revenue"];
const VALID_SORT_ORDERS = ["asc", "desc"];

function toPlainDonation(donation) {
  if (!donation) return donation;
  return typeof donation.toObject === "function"
    ? donation.toObject()
    : donation;
}

export function buildReservationPolicy(donation) {
  const measurementUnit =
    typeof donation === "string" ? donation : donation?.measurementUnit;
  const allowsOnlineReservation =
    allowsOnlineReservationForMeasurementUnit(measurementUnit);

  return {
    allowsOnlineReservation,
    warningMessages: allowsOnlineReservation ? [] : PerRequestDonationWarning,
  };
}

export function toDonationListingResponse(donation) {
  const listing = toPlainDonation(donation);
  if (!listing) return listing;

  return {
    ...listing,
    reservationPolicy: buildReservationPolicy(listing),
  };
}

//VALIDATION HELPERS
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function requireNonEmptyString(value, fieldName) {
  if (!isNonEmptyString(value)) {
    throw new ValidationError(`${fieldName} is required`);
  }
  return value.trim();
}

function optionalString(value, fieldName) {
  if (value === undefined) return undefined;

  if (typeof value != "string") {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  return value.trim();
}

function requireNonNegativeNumber(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new ValidationError(`${fieldName} must be a non-negative number`);
  }
  return number;
}
function requirePositiveNumber(value, fieldName) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new ValidationError(`${fieldName} must be greater than 0`);
  }
  return number;
}
function validateEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(",")}`,
    );
  }
  return value;
}
function normalizePage(value) {
  if (value === undefined) return DEFAULT_PAGE;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError("page must be a positive integer");
  }
  return page;
}

function normalizeLimit(value) {
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

function normalizeSortBy(value) {
  if (value === undefined || value === "") return "createdAt";
  const sortBy = optionalString(value, "sortBy");
  return validateEnum(sortBy, VALID_SORT_FIELDS, "sortBy");
}

function normalizeSortOrder(value) {
  if (value === undefined || value === "") return "desc";
  const sortOrder = optionalString(value, "sortOrder").toLowerCase();
  return validateEnum(sortOrder, VALID_SORT_ORDERS, "sortOrder");
}

function buildSort(sortBy, sortOrder) {
  return {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };
}

function normalizeListingQuery(filters = {}) {
  const sortBy = normalizeSortBy(filters.sortBy);
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
    if (
      filters.isVegetarian !== true &&
      filters.isVegetarian !== false &&
      filters.isVegetarian !== "true" &&
      filters.isVegetarian !== "false"
    ) {
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
//CREATE DONATION FLOW
export async function createDonation(donorProfileId, input = {}) {
  const trustedDonorProfileId = requireNonEmptyString(
    donorProfileId,
    "donorProfileId",
  );
  const name = requireNonEmptyString(input.name, "name");
  const measurementUnit = validateEnum(
    input.measurementUnit,
    VALID_MEASUREMENT_UNIT,
    "measurementUnit",
  );
  const foodCategory = validateEnum(
    input.foodCategory,
    VALID_FOOD_CATEGORY,
    "foodCategory",
  );
  const remainingQuantity = requirePositiveNumber(
    input.remainingQuantity,
    "remainingQuantity",
  );
  const donationLimit =
    input.donationLimit === undefined
      ? 0
      : requireNonNegativeNumber(input.donationLimit, "donationLimit");

  const price =
    input.price === undefined
      ? 0
      : requireNonNegativeNumber(input.price, "price");
  const ration =
    input.ration === undefined
      ? 0
      : requireNonNegativeNumber(input.ration, "ration");

  if (
    input.isVegetarian !== undefined &&
    input.isVegetarian !== null &&
    typeof input.isVegetarian !== "boolean"
  ) {
    throw new ValidationError("isVegetarian must be a boolean or null");
  }
  return donationRepository.create({
    donorProfileId: trustedDonorProfileId,
    name,
    description: optionalString(input.description, "description"),
    measurementUnit,
    foodCategory,
    isVegetarian: input.isVegetarian ?? null,
    donationLimit,
    price,
    remainingQuantity,
    ration,
    status: DonationStatus.Active,
    revenue: 0,
    createdAt: new Date(),
    closedAt: null,
  });
}

/**
 * Creates a fresh active listing from an owned listing's configuration.
 * Historical/operational values are deliberately reset by createDonation.
 */
export async function duplicateDonation(
  sourceDonationId,
  donorProfileId,
  overrides = {},
) {
  const source = await getOwnedDonation(sourceDonationId, donorProfileId);
  const sourceData =
    typeof source.toObject === "function" ? source.toObject() : source;

  // A new name is required because listing names are unique in the current model.
  const name = requireNonEmptyString(overrides.name, "name");
  const donationLimit = overrides.donationLimit ?? sourceData.donationLimit;
  const initialQuantity =
    donationLimit > 0 ? donationLimit : sourceData.remainingQuantity;

  return createDonation(donorProfileId, {
    name,
    description: overrides.description ?? sourceData.description,
    measurementUnit: overrides.measurementUnit ?? sourceData.measurementUnit,
    foodCategory: overrides.foodCategory ?? sourceData.foodCategory,
    isVegetarian:
      overrides.isVegetarian === undefined
        ? sourceData.isVegetarian
        : overrides.isVegetarian,
    donationLimit,
    price: overrides.price ?? sourceData.price,
    remainingQuantity: initialQuantity,
    ration: overrides.ration ?? sourceData.ration,
  });
}
//READ/LOOKUP
export async function getDonationById(id) {
  const donationId = requireNonEmptyString(id, "donationId");
  const donation = await donationRepository.findById(donationId);

  if (!donation) {
    throw new NotFoundError("Donation not found");
  }
  return donation;
}
export async function getOwnedDonation(id, donorProfileId) {
  const donationId = requireNonEmptyString(id, "donationId");
  const ownerId = requireNonEmptyString(donorProfileId, "donorProfileId");
  const donation = await donationRepository.findOwnedDonation(
    donationId,
    ownerId,
  );
  if (!donation) {
    throw new NotFoundError("Donation not found");
  }
  return donation;
}
// Listing and filtering
export async function listDonation(filters = {}) {
  const normalizedFilters = normalizeListingQuery(filters);
  return donationRepository.findAll(normalizedFilters);
}
export async function listActiveDonations(filters = {}) {
  return donationRepository.findActiveDonations({
    ...filters,
    page: normalizePage(filters.page),
    limit: normalizeLimit(filters.limit),
  });
}

export async function listDonorDonations(donorProfileId, options = {}) {
  const ownerId = requireNonEmptyString(donorProfileId, "donorProfileId");
  const normalizedFilters = normalizeListingQuery(options);

  return donationRepository.findDonationsByDonor(ownerId, {
    ...normalizedFilters,
  });
}
//Update Donation Flow
export async function updateDonation(id, donorProfileId, input = {}) {
  const current = await getOwnedDonation(id, donorProfileId);
  const changes = {};

  if (input.name !== undefined) {
    changes.name = requireNonEmptyString(input.name, "name");
  }
  if (input.description !== undefined) {
    changes.description = optionalString(input.description, "description");
  }

  if (input.measurementUnit !== undefined) {
    changes.measurementUnit = validateEnum(
      input.measurementUnit,
      VALID_MEASUREMENT_UNIT,
      "measurementUnit",
    );
  }
  if (input.foodCategory !== undefined) {
    changes.foodCategory = validateEnum(
      input.foodCategory,
      VALID_FOOD_CATEGORY,
      "foodCategory",
    );
  }
  if (input.isVegetarian !== undefined) {
    if (
      input.isVegetarian !== null &&
      typeof input.isVegetarian !== "boolean"
    ) {
      throw new ValidationError("isVegetarian must be a boolean or null");
    }
    changes.isVegetarian = input.isVegetarian;
  }
  for (const field of [
    "donationLimit",
    "price",
    "remainingQuantity",
    "ration",
  ]) {
    if (input[field] !== undefined) {
      changes[field] = requireNonNegativeNumber(input[field], field);
    }
  }
  if (Object.keys(changes).length === 0) {
    throw new ValidationError("No valid fields were provided");
  }

  if (
    current.status === DonationStatus.Cancelled ||
    current.status === DonationStatus.SoldOut
  ) {
    throw new ValidationError("A closed donation cannot be edited");
  }
  const updated = await donationRepository.updateOwnedDonation(
    current.id,
    donorProfileId,
    changes,
  );
  if (!updated) {
    throw new NotFoundError("Donation not found");
  }
  return updated;
}
//Controlled Status Transition
const ALLOWED_STATUS_TRANSITIONS = {
  [DonationStatus.Active]: [DonationStatus.Paused, DonationStatus.Cancelled],
  [DonationStatus.Paused]: [DonationStatus.Active, DonationStatus.Cancelled],
  [DonationStatus.Cancelled]: [],
  [DonationStatus.SoldOut]: [],
};

export async function changeDonationStatus(id, donorProfileId, requestStatus) {
  const status = validateEnum(requestStatus, VALID_STATUSES, "status");

  const donation = await getOwnedDonation(id, donorProfileId);
  const allowedStatuses = ALLOWED_STATUS_TRANSITIONS[donation.status] ?? [];

  if (!allowedStatuses.includes(status)) {
    throw new ValidationError(
      `Donation status error cannot change from ${donation.status} to ${status}`,
    );
  }

  if (status === DonationStatus.Active && donation.remainingQuantity <= 0) {
    throw new ValidationError(
      `A donation with no remaining quantity cannot be activated`,
    );
  }
  const updated = await donationRepository.updateDonationStatus(
    id,
    donorProfileId,
    status,
  );
  if (!updated) {
    throw new NotFoundError("Donation not found");
  }

  if (status === DonationStatus.Cancelled) {
    await reservationRepository.cancelActiveReservationsForDonation(id);
  }

  return updated;
}
//ADD DELETION
export async function deleteDonation(id, donorProfileId) {
  const donation = await getOwnedDonation(id, donorProfileId);
  if (donation.revenue > 0) {
    throw new ValidationError(
      "A donation with recorded revenue cannot be deleted",
    );
  }
  const deleted = await donationRepository.deleteOwnedDonation(
    id,
    donorProfileId,
  );
  if (!deleted) {
    throw new NotFoundError("Donation not found");
  }
  return deleted;
}
