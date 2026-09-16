import { ReservationStatus } from "../models/Reservation.js";
import * as ReservationRepository from "../repositories/ReservationRepository.js";
import { ConflictError } from "../../../shared/errors/errors.js";

export function listReservationsByDonation(donationId, options = {}) {
  return ReservationRepository.findByDonationId(donationId, options);
}

export async function markReservationCollected(donationId, reservationId) {
  const reservation = await ReservationRepository.markReservedAsCollected(
    donationId,
    reservationId,
    new Date(),
  );

  if (!reservation) {
    throw new ConflictError(
      "Reservation is not Reserved for this food listing",
    );
  }

  return reservation;
}

export function cancelActiveReservationsByDonation(donationId, options = {}) {
  return ReservationRepository.cancelActiveReservationsForDonation(
    donationId,
    options,
  );
}

export function recordManualCollection(data, options = {}) {
  return ReservationRepository.createReservation(
    {
      ...data,
      status: ReservationStatus.Collected,
      collectedAt: new Date(),
    },
    { session: options.session },
  );
}
