import { Reservation } from '../models/Reservation';
import { Donation } from '../models/Donation';

class ReservationRepository {
  
  /** Create new reservation */
  async createReservation(reservationData) {
    const newReservation = new Reservation(reservationData);
    return await newReservation.save();
  }

  /** Fetch reservation by recipient id */
  async getReservationsByRecipient(recipientProfileId) {
    return await Reservation.find({ recipientProfileId })
      .sort({ reservedAt: -1 }) 
      .populate('donationId', 'name foodCategory'); 
  }

  /** deduct stock after reservation */
  async deductDonationStock(donationId, quantityToDeduct) {
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

  /** restore stock if reservation fail */
  async restoreDonationStock(donationId, quantityToRestore) {
    return await Donation.findByIdAndUpdate(
      donationId,
      { $inc: { remainingQuantity: quantityToRestore } },
      { new: true }
    );
  }
}

export default new ReservationRepository();