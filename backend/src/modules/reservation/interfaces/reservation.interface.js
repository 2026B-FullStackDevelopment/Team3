import { ValidationError } from "../../../shared/errors/errors.js";
import * as reservationRepository from "../repositories/ReservationRepository.js";

function requireDonationId(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError("donationId is required");
  }
  return value.trim();
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
