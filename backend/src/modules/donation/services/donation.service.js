import * as donationRepository from "../repositories/donation.repo.js";
import * as reservation from "../../reservation/interfaces/reservation.interface.js";
import * as notification from "../../notification/interfaces/notification.interface.js";
import * as identity from "../../identity/index.js";
import { MeasurementUnit, DonationStatus } from "../models/donation.model.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/errors.js";
import { FoodCategory } from "../../../shared/constants/foodCategory.js";
import { toAdminDonationActionDTO } from "../dtos/donation.dto.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const VALID_MEASUREMENT_UNIT = Object.values(MeasurementUnit);
const VALID_STATUSES = Object.values(DonationStatus);
const VALID_FOOD_CATEGORY = Object.values(FoodCategory);
const DONOR_SORT_FIELDS = ["createdAt", "revenue"];
const RECIPIENT_SORT_FIELDS = ["createdAt", "price"];
const VALID_SORT_ORDERS = ["asc", "desc"];

function toPlainDonation(donation) {
  if (!donation) return donation;
  return typeof donation.toObject === "function"
    ? donation.toObject()
    : donation;
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

function requireListingPrice(value) {
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

function normalizeSortBy(value, allowedFields = DONOR_SORT_FIELDS) {
  if (value === undefined || value === "") return "createdAt";
  const sortBy = optionalString(value, "sortBy");
  return validateEnum(sortBy, allowedFields, "sortBy");
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

function normalizeListingQuery(filters = {}, options = {}) {
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

function normalizeRecipientListingQuery(filters = {}) {
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

async function resolveRecipientMunicipalityFilter(filters) {
  if (!filters.municipality) return filters;

  const donorProfileIds =
    await identity.findDonorProfileIdsByMunicipality(filters.municipality);
  const resolvedFilters = { ...filters };
  delete resolvedFilters.municipality;
  return {
    ...resolvedFilters,
    donorProfileIds: donorProfileIds.map(String),
  };
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
    input.price === undefined ? 0 : requireListingPrice(input.price);
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
  const listing = await donationRepository.create({
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

  try {
    await notification.notifyNewListingMatches({
      donationId: String(listing._id),
      donorProfileId: String(listing.donorProfileId),
      foodCategory: listing.foodCategory,
      isVegetarian: listing.isVegetarian,
      price: listing.price,
    });
  } catch (error) {
    console.error("[notification] listing matching failed", error);
  }

  return listing;
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
function normalizeCoordinates(filters) {
  if (filters.latitude === undefined && filters.longitude === undefined) {
    return null;
  }
  const latitude = Number(filters.latitude);
  const longitude = Number(filters.longitude);
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new ValidationError(
      "latitude and longitude must be valid coordinates",
    );
  }
  return { latitude, longitude };
}

function matchesPreference(listing, donor, preference) {
  return (
    preference.foodCategory.includes(listing.foodCategory) &&
    preference.isVegetarian === listing.isVegetarian &&
    listing.price >= preference.priceRangeMin &&
    listing.price <= preference.priceRangeMax &&
    donor?.city?.localeCompare(preference.city, undefined, {
      sensitivity: "accent",
    }) === 0
  );
}

function isSameMunicipality(left, right) {
  if (!left || !right) return false;
  return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
}

function distanceKm(origin, donor) {
  const [longitude, latitude] = donor?.location?.coordinates ?? [];
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
    return Infinity;
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latDelta = radians(latitude - origin.latitude);
  const lonDelta = radians(longitude - origin.longitude);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(origin.latitude)) *
      Math.cos(radians(latitude)) *
      Math.sin(lonDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function attachDonorMunicipalities(result) {
  const donorProfileIds = [
    ...new Set(
      result.entries.map((entry) => String(entry.donorProfileId)),
    ),
  ];
  if (donorProfileIds.length === 0) return result;

  const municipalityRefs =
    await identity.getDonorMunicipalitiesByIds(donorProfileIds);
  const municipalityByDonor = new Map(
    municipalityRefs.map((ref) => [
      String(ref.donorProfileId),
      ref.municipality,
    ]),
  );

  return {
    ...result,
    entries: result.entries.map((entry) => {
      const listing = toPlainDonation(entry);
      return {
        ...listing,
        donorMunicipality:
          municipalityByDonor.get(String(listing.donorProfileId)) ?? null,
      };
    }),
  };
}

export async function listActiveDonations(userId, filters = {}) {
  const normalizedFilters = normalizeRecipientListingQuery(filters);
  const resolvedFilters =
    await resolveRecipientMunicipalityFilter(normalizedFilters);
  const { page, limit } = resolvedFilters;
  const recipient = await identity.getRecipientContext(userId);

  if (!recipient?.isPremium) {
    const result = await donationRepository.findActiveDonations(resolvedFilters);
    return attachDonorMunicipalities(result);
  }

  const preferences = await notification.getRecipientMatchingCriteria(
    recipient.recipientProfileId,
  );
  if (preferences.length === 0) {
    const result = await donationRepository.findActiveDonations(resolvedFilters);
    return attachDonorMunicipalities(result);
  }

  const coordinates = normalizeCoordinates(filters);
  const entries =
    await donationRepository.findActiveDonationsForRanking(resolvedFilters);
  const donorProfileIds = [
    ...new Set(entries.map((entry) => String(entry.donorProfileId))),
  ];
  const donorRefs = await identity.getDonorProximityRefs(donorProfileIds);
  const donors = new Map(
    donorRefs.map((donor) => [String(donor.donorProfileId), donor]),
  );
  const ranked = entries.map((entry, stableIndex) => {
    const donor = donors.get(String(entry.donorProfileId));
    const isMatch = preferences.some((preference) =>
      matchesPreference(entry, donor, preference),
    );
    return {
      entry,
      stableIndex,
      isMatch,
      isRecipientCity: isSameMunicipality(donor?.city, recipient.city),
      distance:
        isMatch && coordinates ? distanceKm(coordinates, donor) : Infinity,
    };
  });
  ranked.sort((left, right) => {
    if (
      !coordinates &&
      left.isRecipientCity !== right.isRecipientCity
    ) {
      return left.isRecipientCity ? -1 : 1;
    }
    if (left.isMatch !== right.isMatch) return left.isMatch ? -1 : 1;
    if (left.distance !== right.distance) return left.distance - right.distance;
    return left.stableIndex - right.stableIndex;
  });

  const start = (page - 1) * limit;
  return attachDonorMunicipalities({
    entries: ranked.slice(start, start + limit).map(({ entry }) => entry),
    total: ranked.length,
    page,
    limit,
  });
}

export async function getActiveDonation(id) {
  const donation = await getDonationById(id);
  if (
    donation.status !== DonationStatus.Active ||
    donation.closedAt ||
    donation.remainingQuantity < 1
  ) {
    throw new NotFoundError("Active donation not found");
  }
  const result = await attachDonorMunicipalities({ entries: [donation] });
  return result.entries[0];
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
  if (isNonEmptyString(filters.searchDonationId)) {
    normalizedFilters.searchDonationId = filters.searchDonationId.trim();
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
      entry.recipientUsername ??
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
  for (const field of ["donationLimit", "remainingQuantity", "ration"]) {
    if (input[field] !== undefined) {
      changes[field] = requireNonNegativeNumber(input[field], field);
    }
  }
  if (input.price !== undefined) {
    changes.price = requireListingPrice(input.price);
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

  return toAdminDonationActionDTO(updated);
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

  return toAdminDonationActionDTO(updated);
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
  return toAdminDonationActionDTO(updated);
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
