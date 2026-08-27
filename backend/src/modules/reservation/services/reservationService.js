// backend/src/modules/reservation/services/reservationService.js

import * as ReservationRepository from '../repositories/reservationRepository.js';
import { Wallet } from '../../wallet/models/Wallet.js';  
import { Notification } from '../../notification/models/Notification.js';
import { Donation } from '../../donation/models/donation.model.js';

export async function processReservation(recipientProfileId, donationId, quantity, paymentMethod, manualRecipientName = null) {
  try {
    // Validate Input
    const donation = await Donation.findById(donationId);

    // Add this temporary debug log:
    console.log("DEBUG FOUND DONATION:", donation);
    
    if (!donation || donation.status !== 'Active') {
      throw new Error("This food listing is not active or unavailable.");
    }
    if (donation.measurementUnit === 'PerRequest') {
      throw new Error("Items marked 'Per Request' cannot be reserved online.");
    }
    if (donation.ration > 0 && quantity > donation.ration) {
      throw new Error(`You cannot reserve more than the allowed ration of ${donation.ration}.`);
    }

    // Prevent Duplicate Reservations
    const existingReservation = await ReservationRepository.checkExistingReservation(recipientProfileId, donationId);
    if (existingReservation) {
      throw new Error("You have already reserved this listing.");
    }

    // Handle Payments 
    const totalPaid = donation.price > 0 ? (donation.price * quantity) : 0;
    
    if (totalPaid > 0 && paymentMethod === 'Wallet') {
       // Interacts with Wallet Module securely via Facade
       await Wallet.deductBalance(recipientProfileId, totalPaid);
    }

    // Stock Deduction
    const updatedDonation = await ReservationRepository.deductDonationStock(donationId, quantity);

    try {
      // Save Reservation Ticket
      const reservationData = {
        donationId,
        recipientProfileId,
        manualRecipientName,
        quantity,
        status: "Reserved",
        paymentMethod: paymentMethod,
        totalPaid: totalPaid
      };

      const newReservation = await ReservationRepository.createReservation(reservationData);
      
      // Trigger Real-Time "Sold Out" Notification if stock is depleted
      if (updatedDonation.remainingQuantity < 1) {
        Notification.emitSoldOutAlert(donationId, donation.donorProfileId);
      }

      return newReservation;

    } catch (error) {
       // Restore food stock and refund wallet if the database fails to save the ticket
       await ReservationRepository.restoreDonationStock(donationId, quantity);
       if (totalPaid > 0 && paymentMethod === 'Wallet') {
           await Wallet.refundBalance(recipientProfileId, totalPaid);
       }
       throw new Error(`Failed to create reservation ticket: ${error.message}`);
      }

  } catch (error) {
    throw new Error(`Failed to create reservation ticket: ${error.message}`);
  }
}

export async function getHistory(recipientProfileId) {
  return await ReservationRepository.getReservationsByRecipient(recipientProfileId);
}