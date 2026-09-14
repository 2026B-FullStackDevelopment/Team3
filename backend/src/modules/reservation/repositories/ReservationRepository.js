import { Donation } from "../../donation/models/donation.model.js";
import { Reservation, ReservationStatus } from "../models/Reservation.js";

/** Create new reservation */
export async function createReservation(reservationData) {
  const newReservation = new Reservation(reservationData);
  return await newReservation.save();
}

/** Fetch recipient by id */
export async function getReservationsByRecipient(recipientProfileId) {
  return await Reservation.find({ recipientProfileId })
    .sort({ reservedAt: -1 })
    .populate("donationId", "name foodCategory");
}

/** Deduct the remaining stock */
export async function deductDonationStock(donationId, quantityToDeduct) {
  const updatedDonation = await Donation.findOneAndUpdate(
    { _id: donationId, remainingQuantity: { $gte: quantityToDeduct } },
    { $inc: { remainingQuantity: -quantityToDeduct } },
    { new: true },
  );

  if (!updatedDonation) {
    throw new Error("Insufficient stock or donation not found.");
  }
  return updatedDonation;
}

/** Undo the deduction when reservation failed */
export async function restoreDonationStock(donationId, quantityToRestore) {
  return await Donation.findByIdAndUpdate(
    donationId,
    { $inc: { remainingQuantity: quantityToRestore } },
    { new: true },
  );
}

/** Check if a reservation already exists for this recipient and donation */
export async function checkExistingReservation(recipientProfileId, donationId) {
  return await Reservation.findOne({ recipientProfileId, donationId });
}

export async function findByDonationId(donationId, options = {}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    Reservation.find({ donationId })
      .skip(skip)
      .limit(limit)
      .populate("recipientProfileId"),
    Reservation.countDocuments({ donationId }),
  ]);
  return { entries, total, page, limit };
}

/**
 * Returns the recipient profiles that currently hold active reservations for
 * a listing. Manual/walk-in reservations have no recipientProfileId and are
 * deliberately excluded from the notification audience.
 */
export async function listAffectedRecipientProfileIds(
  donationId,
  options = {},
) {
  const query = Reservation.distinct("recipientProfileId", {
    donationId,
    status: ReservationStatus.Reserved,
    recipientProfileId: { $ne: null },
  });
  if (options.session) query.session(options.session);
  return query;
}

export async function cancelActiveReservationsForDonation(
  donationId,
  options = {},
) {
  return await Reservation.updateMany(
    { donationId, status: ReservationStatus.Reserved },
    { $set: { status: ReservationStatus.CancelledByDonor } },
    { session: options.session },
  );
}

export async function cancelActiveReservationsByAdmin(
  donationId,
  options = {},
) {
  return await Reservation.updateMany(
    { donationId, status: ReservationStatus.Reserved },
    { $set: { status: ReservationStatus.CancelledByAdmin } },
    { session: options.session },
  );
}
