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

export function listReservationsByDonation(donationId, options = {}) {
  return donationSupportService.listReservationsByDonation(
    requireDonationId(donationId),
    options,
  );
}

export function cancelActiveReservationsByDonation(
  donationId,
  options = {},
) {
  return donationSupportService.cancelActiveReservationsByDonation(
    requireDonationId(donationId),
    options,
  );
}

export function recordManualCollection(data, options = {}) {
  return donationSupportService.recordManualCollection(
    {
      ...data,
      donationId: requireDonationId(data?.donationId),
    },
    options,
  );
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
