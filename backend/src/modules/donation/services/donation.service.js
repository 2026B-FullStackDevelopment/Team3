import * as donationRepository from "../repositories/donation.repo.js";
import * as reservation from "../../reservation/interfaces/reservation.interface.js";
import {
  allowsOnlineReservationForMeasurementUnit,
  MeasurementUnit,
  PerRequestDonationWarning,
  DonationStatus,
  DonationSchema,
} from "../models/donation.model.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/errors.js";
import { toDonationSummaryDTO } from "../dtos/donation.dto.js";

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

function optionalNullableBoolean(value, fieldName) {
  if (value === undefined || value === null || value === "") return value;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  if (value === "null") return null;
  throw new ValidationError(`${fieldName} must be true, false or null`);
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
  const imageUrl = requireNonEmptyString(input.imageUrl, "imageUrl");
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
  // Multipart form fields arrive as strings, so normalize the supported
  // boolean values before writing the donation document.
  const isVegetarian = optionalNullableBoolean(
    input.isVegetarian,
    "isVegetarian",
  );
  return donationRepository.create({
    donorProfileId: trustedDonorProfileId,
    name,
    description: optionalString(input.description, "description"),
    imageUrl,
    measurementUnit,
    foodCategory,
    isVegetarian: isVegetarian ?? null,
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

  if (sourceData.status === DonationStatus.PendingCancellation) {
    throw new ConflictError(
      "A listing pending cancellation cannot be duplicated",
    );
  }

  // A new name is required because listing names are unique in the current model.
  const name = requireNonEmptyString(overrides.name, "name");
  const donationLimit = overrides.donationLimit ?? sourceData.donationLimit;
  const initialQuantity =
    donationLimit > 0 ? donationLimit : sourceData.remainingQuantity;

  return createDonation(donorProfileId, {
    name,
    description: overrides.description ?? sourceData.description,
    // Duplication reuses the already-stored source image. The normal create
    // route still requires a newly uploaded image before this service is called.
    imageUrl: sourceData.imageUrl,
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
export async function getDonationById(id, options = {}) {
  const donationId = requireNonEmptyString(id, "donationId");
  const donation = await donationRepository.findById(donationId, options);

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

/**
 * Admin-wide view of active food listings (SRS 7.3.1), reusing the same
 * query as listActiveDonations (the Recipient browse page) plus exact
 * donationId/donorProfileId filters and the combined search box (SRS
 * 7.3.2) -- filters a Recipient has no reason to use, so they're kept out
 * of normalizeListingQuery and added only here.
 *
 * donorProfileId and donorProfileIds are both passed through independently
 * (not one-or-the-other) -- buildDonationQuery is the one place that
 * decides how they combine (it ANDs them) if a caller supplies both.
 * searchDonorProfileIds is a separate, distinctly-named field: it's ORed
 * with the `search` text match (grocery name OR account/donor name), not
 * ANDed like donorProfileIds above.
 */
export async function listActiveListingsForAdmin(filters = {}) {
  const normalizedFilters = normalizeListingQuery(filters);

  if (isNonEmptyString(filters.donationId)) {
    normalizedFilters.donationId = filters.donationId.trim();
  }
  if (isNonEmptyString(filters.donorProfileId)) {
    normalizedFilters.donorProfileId = filters.donorProfileId.trim();
  }
  if (
    Array.isArray(filters.donorProfileIds) &&
    filters.donorProfileIds.length > 0
  ) {
    normalizedFilters.donorProfileIds = filters.donorProfileIds;
  }
  if (Array.isArray(filters.searchDonorProfileIds)) {
    normalizedFilters.searchDonorProfileIds = filters.searchDonorProfileIds;
  }

  return donationRepository.findActiveDonations(normalizedFilters);
}

export async function listDonorDonations(donorProfileId, options = {}) {
  const ownerId = requireNonEmptyString(donorProfileId, "donorProfileId");
  const normalizedFilters = normalizeListingQuery(options);

  return donationRepository.findDonationsByDonor(ownerId, {
    ...normalizedFilters,
  });
}

export function toListingDonationResponse(reservation) {
  const entry = toPlainDonation(reservation);
  const recipient = entry.recipientProfileId;

  return {
    id: entry._id ?? entry.id,
    recipientUsername:
      recipient?.userName ??
      recipient?.username ??
      entry.manualRecipientName ??
      null,
    reservedAt: entry.reservedAt ?? null,
    collectedAt: entry.collectedAt ?? null,
    quantity: entry.quantity,
    status: entry.status,
    totalPaid: entry.totalPaid,
    paymentMethod: entry.paymentMethod ?? null,
    feedback: entry.feedback ?? null,
  };
}

export async function listFoodListingDonations(
  donationId,
  donorProfileId,
  options = {},
) {
  const listing = await getOwnedDonation(donationId, donorProfileId);
  const page = normalizePage(options.page);
  const limit = normalizeLimit(options.limit);
  const result = await reservation.listReservationsByDonation(listing.id, {
    page,
    limit,
  });

  return {
    ...result,
    entries: result.entries.map(toListingDonationResponse),
  };
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
    current.status === DonationStatus.SoldOut ||
    current.status === DonationStatus.PendingCancellation
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

export async function updateDonationRation(
  id,
  donorProfileId,
  requestedRation,
) {
  const donation = await getOwnedDonation(id, donorProfileId);
  const ration = requireNonNegativeNumber(requestedRation, "ration");

  if (
    donation.status === DonationStatus.Cancelled ||
    donation.status === DonationStatus.SoldOut ||
    donation.status === DonationStatus.PendingCancellation ||
    donation.closedAt
  ) {
    throw new ValidationError("A closed donation cannot be edited");
  }
  if (donation.donationLimit > 0 && ration > donation.donationLimit) {
    throw new ValidationError("ration cannot exceed donationLimit");
  }
  if (ration > 0 && ration > donation.remainingQuantity) {
    throw new ValidationError("ration cannot exceed remainingQuantity");
  }

  const updated = await donationRepository.updateDonationRation(
    id,
    donorProfileId,
    ration,
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
    await reservation.cancelActiveReservationsByDonation(id);
  }

  return updated;
}

/**
 * Puts any Active food listing into cancellation limbo (SRS 7.2.2,
 * Admin-only), rather than cancelling it outright. Unlike the donor's own
 * changeDonationStatus, this has no ownership filter -- getDonationById, not
 * getOwnedDonation. Only Active -> PendingCancellation is allowed here:
 * 7.2.2's wording is "cancel any active food listing," narrower than the
 * donor-facing 4.2.3 (which also allows cancelling from Paused).
 *
 * The listing's reservations are deliberately left untouched here -- the
 * cascade only happens if/when finalizeCancellation runs (see below). This
 * status flip is the only write, so it doesn't need the transaction the old
 * cancel-and-cascade version did; options.session is still accepted so the
 * caller (the Admin module) can fold it into its own transaction alongside
 * the audit-log write.
 */
export async function adminCancelDonation(id, options = {}) {
  const donationId = requireNonEmptyString(id, "donationId");

  const updated = await donationRepository.requestAdminCancellation(
    donationId,
    options,
  );
  if (!updated) {
    throw new ConflictError(
      "Only an active food listing can enter pending cancellation",
    );
  }

  return toDonationSummaryDTO(updated);
}

/**
 * Reverses an admin cancellation that's still within its undo window
 * (called from AuditLog's undoAction). Since adminCancelDonation never
 * touched anything but the donation's own status, undo is symmetric: just
 * flip PendingCancellation back to Active. No reservation restoration --
 * nothing was ever cascaded.
 */
export async function reinstateDonation(id, options = {}) {
  const donationId = requireNonEmptyString(id, "donationId");
  const updated = await donationRepository.reinstateAdminCancellation(
    donationId,
    options,
  );
  if (!updated) {
    throw new ConflictError("The cancellation can no longer be undone");
  }

  return toDonationSummaryDTO(updated);
}

/**
 * Makes an admin cancellation real once its undo window has expired.
 * The Admin workflow supplies the shared transaction and coordinates the
 * reservation cascade, audit finalization, and recipient notifications around
 * this Donation-owned state transition.
 */
export async function finalizeCancellation(id, options = {}) {
  const donationId = requireNonEmptyString(id, "donationId");
  const updated = await donationRepository.finalizeAdminCancellation(
    donationId,
    options,
  );
  if (!updated) {
    throw new ConflictError(
      "The listing is not an expired pending cancellation",
    );
  }
  return toDonationSummaryDTO(updated);
}
//ADD DELETION
export async function deleteDonation(id, donorProfileId) {
  const donation = await getOwnedDonation(id, donorProfileId);
  if (donation.revenue > 0) {
    throw new ValidationError(
      "A donation with recorded revenue cannot be deleted",
    );
  }
  if (donation.status === DonationStatus.PendingCancellation) {
    throw new ConflictError(
      "A donation pending cancellation review cannot be deleted",
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
