import { ValidationError } from "../../../shared/errors/errors.js";
import * as reservationRepository from "../repositories/ReservationRepository.js";
import * as donationSupportService from "../services/donationSupport.service.js";

function requireDonationId(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError("donationId is required");
  }
  return value.trim();
}

function requireDonationIds(values) {
  if (!Array.isArray(values)) {
    throw new ValidationError("donationIds must be an array");
  }
  return [...new Set(values.map(requireDonationId))];
}

function requireOptionalDate(value, fieldName) {
  if (value === undefined) return undefined;
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid Date`);
  }
  return value;
}

function requireReservationId(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError("reservationId is required");
  }
  return value.trim();
}

function toFeedbackDTO(reservation) {
  if (!reservation) return reservation;

  return {
    id: reservation._id ?? reservation.id,
    donationId: reservation.donationId,
    recipientProfileId: reservation.recipientProfileId,
    status: reservation.status,
    feedback: reservation.feedback,
    collectedAt: reservation.collectedAt,
  };
}

function getReservationId(reservation) {
  const id = reservation?._id ?? reservation?.id;
  return id === undefined || id === null ? id : String(id);
}

/** Minimal Reservation shape required by Donation's donor-facing history. */
function toDonationListingReservationDTO(reservation) {
  if (!reservation) return reservation;
  const recipient = reservation.recipientProfileId;

  return {
    id: getReservationId(reservation),
    donationId: reservation.donationId,
    recipientUsername:
      recipient?.userName ??
      recipient?.username ??
      reservation.manualRecipientName ??
      null,
    reservedAt: reservation.reservedAt ?? null,
    collectedAt: reservation.collectedAt ?? null,
    quantity: reservation.quantity,
    status: reservation.status,
    totalPaid: reservation.totalPaid,
    paymentMethod: reservation.paymentMethod ?? null,
    feedback: reservation.feedback ?? null,
  };
}

/** Minimal Reservation shape returned to Donation after a manual collection. */
function toManualCollectionDTO(reservation) {
  if (!reservation) return reservation;

  return {
    id: getReservationId(reservation),
    recipientName: reservation.manualRecipientName ?? null,
    quantity: reservation.quantity,
    status: reservation.status,
    totalPaid: reservation.totalPaid,
    paymentMethod: reservation.paymentMethod ?? null,
    collectedAt: reservation.collectedAt ?? null,
  };
}

export async function listAffectedRecipientProfileIds(
  donationId,
  options = {},
) {
  const profileIds =
    await reservationRepository.listAffectedRecipientProfileIds(
      requireDonationId(donationId),
      options,
    );

  return [
    ...new Set(
      profileIds
        .filter((profileId) => profileId !== null && profileId !== undefined)
        .map(String),
    ),
  ];
}

export function cancelActiveReservationsByAdmin(donationId, options = {}) {
  return reservationRepository.cancelActiveReservationsByAdmin(
    requireDonationId(donationId),
    options,
  );
}

export async function listReservationsByDonation(donationId, options = {}) {
  const result = await donationSupportService.listReservationsByDonation(
    requireDonationId(donationId),
    options,
  );

  return {
    ...result,
    entries: result.entries.map(toDonationListingReservationDTO),
  };
}

export async function markReservationCollected(donationId, reservationId) {
  const updated = await donationSupportService.markReservationCollected(
    requireDonationId(donationId),
    requireReservationId(reservationId),
  );

  return toDonationListingReservationDTO(updated);
}

export function cancelActiveReservationsByDonation(donationId, options = {}) {
  return donationSupportService.cancelActiveReservationsByDonation(
    requireDonationId(donationId),
    options,
  );
}

export async function recordManualCollection(data, options = {}) {
  const reservation = await donationSupportService.recordManualCollection(
    {
      ...data,
      donationId: requireDonationId(data?.donationId),
    },
    options,
  );
  return toManualCollectionDTO(reservation);
}

export async function summarizeCollectedReservationsByDonation(
  donationIds,
  options = {},
) {
  const periodStart = requireOptionalDate(options.periodStart, "periodStart");
  const periodEnd = requireOptionalDate(options.periodEnd, "periodEnd");
  if (
    periodStart !== undefined &&
    periodEnd !== undefined &&
    periodStart > periodEnd
  ) {
    throw new ValidationError("periodStart cannot be after periodEnd");
  }

  const rows = await reservationRepository.aggregateCollectedByDonationIds(
    requireDonationIds(donationIds),
    {
      periodStart,
      periodEnd,
      session: options.session,
    },
  );

  return rows.map((row) => ({
    donationId: String(row.donationId),
    donatedQuantity: Number(row.donatedQuantity ?? 0),
    donationCount: Number(row.donationCount ?? 0),
    revenue: Number(row.revenue ?? 0),
  }));
}

/**
 * Attach recipient feedback (SRS 5.2.4). recipientProfileId is trusted here
 * -- it's resolved from a real RecipientProfile lookup one step earlier in
 * the caller, not raw user input, same trust split as `options.session`
 * elsewhere in this file. reservationId is a raw URL param, so that's the
 * one arg actually validated at this boundary.
 */
export async function submitFeedback(
  reservationId,
  recipientProfileId,
  feedback,
) {
  const updated = await reservationRepository.submitFeedback(
    requireReservationId(reservationId),
    recipientProfileId,
    feedback,
  );

  return toFeedbackDTO(updated);
}
