import * as donationRepository from "../repositories/donorListingRepository.js";
import {
  MeasurementUnit,
  DonationStatus,
  DonationSchema,
  Donation,
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
      `${fieldName}must be one of: ${allowedValues.join(",")}`,
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
  const normalizedFilters = {
    page: normalizePage(filters.page),
    limit: normalizeLimit(filters.limit),
    included: filters.includedClosed === true,
  };
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
    normalizedFilters.search = optionalString(filters.search, "search ");
  }
  if (filters.isVegetarian !== undefined) {
    if (
      filters.isVegetarian !== true &&
      filters.isVegetarian !== false &&
      filters.isVegetarian !== "true" &&
      filters.isVegetarian !== "false"
    ) {
      throw new ValidationError("isVegetarain must be true or false");
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

  return donationRepository.findDonationsByDonor(ownerId, {
    includeClosed: options.includeClosed !== false,
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
    current.status === Donation.status.Cancelled ||
    current.status === Donation.status.SoldOut
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
  [DonationStatus.Active]: [
    DonationStatus.Paused,
    DonationStatus.PendingCancellation,
    Donation.Cancelled,
    Donation.SoldOut,
  ],
  [DonationStatus.Paused]: [
    DonationStatus.Active,
    DonationStatus.PendingCancellation,
    DonationStatus.Cancelled,
  ],
  [DonationStatus.PendingCancellation]: [
    DonationStatus.Active,
    DonationStatus.Cancelled,
  ],
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
  return donationRepository.updateDonationStatus(id, donorProfileId, status);
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
