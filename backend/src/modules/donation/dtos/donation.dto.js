import {
  allowsOnlineReservationForMeasurementUnit,
  PerRequestDonationWarning,
} from "../models/donation.model.js";

function getDonationId(donation) {
  const id = donation?._id ?? donation?.id;
  return id === undefined || id === null ? id : String(id);
}

function buildReservationPolicy(donation) {
  const allowsOnlineReservation = allowsOnlineReservationForMeasurementUnit(
    donation?.measurementUnit,
  );

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

/** Maps only the fields a Recipient needs to browse active food listings. */
export function toRecipientListingDTO(donation) {
  if (!donation) return donation;

  return {
    id: getDonationId(donation),
    name: donation.name,
    description: donation.description,
    imageUrl: donation.imageUrl,
    foodCategory: donation.foodCategory,
    isVegetarian: donation.isVegetarian,
    remainingQuantity: donation.remainingQuantity,
    ration: donation.ration,
    measurementUnit: donation.measurementUnit,
    price: donation.price,
    donorMunicipality: donation.donorMunicipality ?? null,
    createdAt: donation.createdAt,
    reservationPolicy: buildReservationPolicy(donation),
  };
}

/** Maps the nested result returned after a Donor records an in-person donation. */
export function toManualDonationResponseDTO(result) {
  if (!result) return result;

  const donation = result.donation;
  const payment = result.payment;
  const soldOutAlert = result.soldOutAlert;

  return {
    donation: donation
      ? {
          id: String(donation.id ?? donation._id),
          recipientName:
            donation.recipientName ?? donation.manualRecipientName ?? null,
          quantity: donation.quantity,
          status: donation.status,
          totalPaid: donation.totalPaid,
          paymentMethod: donation.paymentMethod ?? null,
          collectedAt: donation.collectedAt,
        }
      : null,
    payment: payment
      ? {
          method: payment.method,
          totalPrice: payment.totalPrice,
          amountReceived: payment.amountReceived,
          change: payment.change,
        }
      : null,
    listing: toDonorListingDTO(result.listing),
    soldOutAlert: soldOutAlert
      ? {
          event: soldOutAlert.event,
          donationId: soldOutAlert.donationId,
          donationName: soldOutAlert.donationName,
          closedAt: soldOutAlert.closedAt,
          message: soldOutAlert.message,
        }
      : null,
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

/** Public active-listing shape used by the authenticated Recipient browse UI. */
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
