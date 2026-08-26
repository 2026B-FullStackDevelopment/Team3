import * as donationRepository from "../../donation/repositories/donorListingRepository.js";
import {
  DonationStatus,
  MeasurementUnit,
} from "../../donation/models/donation.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/errors.js";
import * as reservationRepository from "../repositories/reservationRepository.js";

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

export async function validateReservationRequest(
  recipientProfileId,
  donationId,
  requestedQuantity,
) {
  const recipientId = requireNonEmptyString(
    recipientProfileId,
    "recipientProfileId",
  );
  const listingId = requireNonEmptyString(donationId, "donationId");
  const quantity = requirePositiveNumber(requestedQuantity, "quantity");
  const listing = await donationRepository.findDonationById(listingId);

  if (!listing) {
    throw new NotFoundError("Food listing not found");
  }
  if (listing.status !== DonationStatus.Active || listing.closedAt) {
    throw new ConflictError("Food listing is not accepting reservations");
  }
  if (listing.measurementUnit === MeasurementUnit.PerRequest) {
    throw new ConflictError(
      "Per-request food listings do not accept online reservations",
    );
  }
  if (quantity > listing.remainingQuantity) {
    throw new ConflictError("Requested quantity exceeds remaining quantity");
  }
  if (listing.ration > 0 && quantity > listing.ration) {
    throw new ConflictError("Requested quantity exceeds ration limit");
  }

  const existingReservation = await reservationRepository.findActiveReservation(
    listingId,
    recipientId,
  );
  if (existingReservation) {
    throw new ConflictError(
      "Recipient already has an active reservation for this listing",
    );
  }

  return { listing, quantity };
}
