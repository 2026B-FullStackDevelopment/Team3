import { Reservation, ReservationStatus } from "../models/Reservation.js";

export async function cancelActiveReservationsForDonation(donationId) {
  return Reservation.updateMany(
    { donationId, status: ReservationStatus.Reserved },
    { $set: { status: ReservationStatus.CancelledByDonor } },
  );
}

export async function findActiveReservation(donationId, recipientProfileId) {
  return Reservation.findOne({
    donationId,
    recipientProfileId,
    status: ReservationStatus.Reserved,
  });
}

export async function findByDonationId(
  donationId,
  { page = 1, limit = 20 } = {},
) {
  const skip = (page - 1) * limit;
  const query = { donationId };
  const [entries, total] = await Promise.all([
    Reservation.find(query)
      .sort({ reservedAt: -1, collectedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("recipientProfileId", "userName"),
    Reservation.countDocuments(query),
  ]);

  return { entries, total, page, limit };
}
