import { Reservation, ReservationStatus } from "../models/Reservation.js";

export async function cancelActiveReservationsForDonation(donationId) {
  return Reservation.updateMany(
    { donationId, status: ReservationStatus.Reserved },
    { $set: { status: ReservationStatus.CancelledByDonor } },
  );
}
