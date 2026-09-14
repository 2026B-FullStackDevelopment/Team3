import { ReservationStatus } from "../models/Reservation.js";
import * as ReservationRepository from "../repositories/ReservationRepository.js";

export function listReservationsByDonation(donationId, options = {}) {
  return ReservationRepository.findByDonationId(donationId, options);
}

export function cancelActiveReservationsByDonation(
  donationId,
  options = {},
) {
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
