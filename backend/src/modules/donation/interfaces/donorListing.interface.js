import * as donationRepository from "../repositories/donorListing.repository.js";
import { buildSoldOutAlert } from "../services/soldOutAlert.service.js";
import {
  allowsOnlineReservationForMeasurementUnit,
  DonationStatus,
  MeasurementUnit,
} from "../models/donation.model.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/errors.js";

const RESERVATION_BLOCK_REASONS = {
  NotActive: "NOT_ACTIVE",
  Closed: "CLOSED",
  PerRequest: "PER_REQUEST",
  InsufficientQuantity: "INSUFFICIENT_QUANTITY",
  RationExceeded: "RATION_EXCEEDED",
};

function toPlainDonation(donation) {
  if (!donation) return donation;
  return typeof donation.toObject === "function"
    ? donation.toObject()
    : donation;
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${fieldName} is required`);
  }
  return value.trim();
}

function requirePositiveNumber(value, fieldName) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new ValidationError(`${fieldName} must be greater than 0`);
  }
  return number;
}

function requireNonNegativeNumber(value, fieldName) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new ValidationError(`${fieldName} must be a non-negative number`);
  }
  return number;
}

function getDonationId(donation) {
  return String(donation._id ?? donation.id);
}

function getReservationBlockReason(listing, quantity) {
  if (listing.status !== DonationStatus.Active) {
    return RESERVATION_BLOCK_REASONS.NotActive;
  }
  if (listing.closedAt) {
    return RESERVATION_BLOCK_REASONS.Closed;
  }
  if (!allowsOnlineReservationForMeasurementUnit(listing.measurementUnit)) {
    return RESERVATION_BLOCK_REASONS.PerRequest;
  }
  if (quantity !== undefined && quantity > listing.remainingQuantity) {
    return RESERVATION_BLOCK_REASONS.InsufficientQuantity;
  }
  if (
    quantity !== undefined &&
    listing.ration > 0 &&
    quantity > listing.ration
  ) {
    return RESERVATION_BLOCK_REASONS.RationExceeded;
  }
  return null;
}

function buildReservationCheck(listing, quantity) {
  const reason = getReservationBlockReason(listing, quantity);

  return {
    canAccept: reason === null,
    reason,
    donationId: getDonationId(listing),
    status: listing.status,
    closedAt: listing.closedAt ?? null,
    measurementUnit: listing.measurementUnit,
    remainingQuantity: listing.remainingQuantity,
    ration: listing.ration,
    requestedQuantity: quantity ?? null,
  };
}

function throwReservationBlock(reason) {
  if (reason === RESERVATION_BLOCK_REASONS.PerRequest) {
    throw new ConflictError(
      "Per-request food listings do not accept online reservations",
    );
  }
  if (reason === RESERVATION_BLOCK_REASONS.InsufficientQuantity) {
    throw new ConflictError("Requested quantity exceeds remaining quantity");
  }
  if (reason === RESERVATION_BLOCK_REASONS.RationExceeded) {
    throw new ConflictError("Requested quantity exceeds ration limit");
  }
  throw new ConflictError("Food listing is not accepting reservations");
}

function buildReservationResult(listing, quantity) {
  const plainListing = toPlainDonation(listing);
  const check = buildReservationCheck(plainListing, quantity);

  if (!check.canAccept) {
    throwReservationBlock(check.reason);
  }

  return {
    listing,
    quantity,
    policy: check,
  };
}

export async function readDonationById(id, options = {}) {
  const donationId = requireNonEmptyString(id, "donationId");
  const donation = await donationRepository.findById(donationId, options);

  if (!donation) {
    throw new NotFoundError("Donation not found");
  }

  return donation;
}

export async function readListingById(id, options = {}) {
  return readDonationById(id, options);
}

export async function canAcceptReservations(
  id,
  requestedQuantity,
  options = {},
) {
  const listing = await readDonationById(id, options);
  const quantity =
    requestedQuantity === undefined
      ? undefined
      : requirePositiveNumber(requestedQuantity, "quantity");

  return buildReservationCheck(toPlainDonation(listing), quantity);
}

export async function assertListingCanAcceptReservations(
  id,
  requestedQuantity,
  options = {},
) {
  const quantity = requirePositiveNumber(requestedQuantity, "quantity");
  const listing = await readDonationById(id, options);

  return buildReservationResult(listing, quantity);
}

export async function applyReservation(
  id,
  requestedQuantity,
  totalPaid = 0,
  options = {},
) {
  const donationId = requireNonEmptyString(id, "donationId");
  const quantity = requirePositiveNumber(requestedQuantity, "quantity");
  const reservationRevenue = requireNonNegativeNumber(totalPaid, "totalPaid");

  await assertListingCanAcceptReservations(donationId, quantity, options);

  const updatedListing = await donationRepository.applyReservation(
    donationId,
    quantity,
    reservationRevenue,
    options,
  );

  if (!updatedListing) {
    throw new ConflictError("The listing changed; retry the reservation");
  }

  return {
    listing: updatedListing,
    soldOut: updatedListing.status === DonationStatus.SoldOut,
    soldOutAlert: getSoldOutAlertDataFromListing(updatedListing),
  };
}

export async function restoreReservationQuantity(
  id,
  cancelledQuantity,
  options = {},
) {
  const donationId = requireNonEmptyString(id, "donationId");
  const quantity = requirePositiveNumber(cancelledQuantity, "quantity");
  const listing = await readDonationById(donationId, options);

  if (listing.status === DonationStatus.Cancelled) {
    throw new ConflictError("A cancelled donation cannot restore quantity");
  }

  const updatedListing = await donationRepository.incrementRemainingQuantity(
    donationId,
    quantity,
    options,
  );

  if (!updatedListing) {
    throw new NotFoundError("Donation not found");
  }

  return updatedListing;
}

export async function closeListingWhenSoldOut(id, options = {}) {
  const donationId = requireNonEmptyString(id, "donationId");
  const listing = await readDonationById(donationId, options);

  if (listing.status === DonationStatus.SoldOut) {
    return listing;
  }
  if (listing.status !== DonationStatus.Active || listing.closedAt) {
    throw new ConflictError(
      "Only active food listings can be closed as sold out",
    );
  }
  if (listing.remainingQuantity > 0) {
    return null;
  }

  return donationRepository.closeIfSoldOut(donationId, options);
}

function getSoldOutAlertDataFromListing(listing) {
  const plainListing = toPlainDonation(listing);

  if (
    plainListing.status !== DonationStatus.SoldOut &&
    plainListing.remainingQuantity > 0
  ) {
    return null;
  }

  return buildSoldOutAlert(plainListing);
}

export async function getSoldOutAlertData(donationOrId, options = {}) {
  const listing =
    typeof donationOrId === "string"
      ? await readDonationById(donationOrId, options)
      : donationOrId;

  if (!listing) {
    throw new NotFoundError("Donation not found");
  }

  return getSoldOutAlertDataFromListing(listing);
}

export {
  DonationStatus,
  MeasurementUnit,
  RESERVATION_BLOCK_REASONS as ReservationBlockReasons,
};
