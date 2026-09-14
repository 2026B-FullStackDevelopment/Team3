import {
  allowsOnlineReservationForMeasurementUnit,
  PerRequestDonationWarning,
} from "../models/donation.model.js";

function getDonationId(donation) {
  const id = donation?._id ?? donation?.id;
  return id === undefined || id === null ? id : String(id);
}

function buildReservationPolicy(donation) {
  const allowsOnlineReservation =
    allowsOnlineReservationForMeasurementUnit(donation?.measurementUnit);

  return {
    allowsOnlineReservation,
    warningMessages: allowsOnlineReservation ? [] : PerRequestDonationWarning,
  };
}

/** Maps a Donation document to the authenticated Donor listing contract. */
export function toDonorListingDTO(donation) {
  if (!donation) return donation;

  return {
    id: getDonationId(donation),
    name: donation.name,
    description: donation.description,
    imageUrl: donation.imageUrl,
    measurementUnit: donation.measurementUnit,
    foodCategory: donation.foodCategory,
    isVegetarian: donation.isVegetarian,
    donationLimit: donation.donationLimit,
    price: donation.price,
    remainingQuantity: donation.remainingQuantity,
    ration: donation.ration,
    status: donation.status,
    revenue: donation.revenue,
    createdAt: donation.createdAt,
    closedAt: donation.closedAt,
    reservationPolicy: buildReservationPolicy(donation),
  };
}

/** Maps listing fields required for Reservation eligibility and payment. */
export function toReservationDonationDTO(donation) {
  if (!donation) return donation;

  return {
    id: getDonationId(donation),
    donorProfileId: donation.donorProfileId,
    name: donation.name,
    status: donation.status,
    measurementUnit: donation.measurementUnit,
    price: donation.price,
    remainingQuantity: donation.remainingQuantity,
    ration: donation.ration,
    closedAt: donation.closedAt,
  };
}

/** Maps only state changed by Reservation stock operations. */
export function toReservationDonationStateDTO(donation) {
  if (!donation) return donation;

  return {
    id: getDonationId(donation),
    status: donation.status,
    remainingQuantity: donation.remainingQuantity,
    closedAt: donation.closedAt,
  };
}

/** Maps fields required by the Admin active-listing view. */
export function toAdminDonationSummaryDTO(donation) {
  if (!donation) return donation;

  return {
    id: getDonationId(donation),
    donorProfileId: donation.donorProfileId,
    name: donation.name,
    status: donation.status,
    foodCategory: donation.foodCategory,
    measurementUnit: donation.measurementUnit,
    price: donation.price,
    remainingQuantity: donation.remainingQuantity,
    createdAt: donation.createdAt,
  };
}

/** Preserves the established DTO contract for Admin mutation responses. */
export function toAdminDonationActionDTO(donation) {
  if (!donation) return donation;

  return {
    id: getDonationId(donation),
    name: donation.name,
    donorProfileId: donation.donorProfileId,
    status: donation.status,
    foodCategory: donation.foodCategory,
    measurementUnit: donation.measurementUnit,
    price: donation.price,
    remainingQuantity: donation.remainingQuantity,
    revenue: donation.revenue,
    createdAt: donation.createdAt,
    closedAt: donation.closedAt,
  };
}

/** Maps the established previous-state contract for an Admin cancellation. */
export function toDonationAuditSnapshotDTO(donation) {
  return toAdminDonationActionDTO(donation);
}
