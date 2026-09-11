import { Reservation } from '../models/Reservation.js';
import { Donation } from '../../donation/models/donation.model.js';

/** Create new reservation */
export async function createReservation(reservationData) {
  const newReservation = new Reservation(reservationData);
  return await newReservation.save();
}

/** Fetch recipient by id */
export async function getReservationsByRecipient(recipientProfileId) {
  return await Reservation.find({ recipientProfileId })
    .sort({ reservedAt: -1 })
    .populate('donationId', 'name foodCategory');
}

/** Deduct the remaining stock */
export async function deductDonationStock(donationId, quantityToDeduct) {
  const updatedDonation = await Donation.findOneAndUpdate(
    { _id: donationId, remainingQuantity: { $gte: quantityToDeduct } }, 
    { $inc: { remainingQuantity: -quantityToDeduct } },
    { new: true } 
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
    { new: true }
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
    Reservation.find({ donationId }).skip(skip).limit(limit).populate('recipientProfileId'),
    Reservation.countDocuments({ donationId }),
  ]);
  return { entries, total, page, limit };
}

export async function cancelActiveReservationsForDonation(donationId, options = {}) {
  return await Reservation.updateMany(
    { donationId, status: "Reserved" },
    { $set: { status: "CancelledByDonor" } },
    { session: options.session },
  );
}