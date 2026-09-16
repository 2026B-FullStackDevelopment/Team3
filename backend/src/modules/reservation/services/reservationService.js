import { randomUUID } from "node:crypto";
import * as ReservationRepository from "../repositories/ReservationRepository.js";
import {
  applyReservation,
  readListingById,
  restoreReservationQuantity,
} from "../../donation/interfaces/donation.interface.js";
import { credit, debit, TransactionType } from "../../wallet/index.js";
import * as notification from "../../notification/interfaces/notification.interface.js";
import * as paymentsFacade from "../../payments/index.js";

export async function processReservation(
  recipientProfileId,
  userId,
  donationId,
  quantity,
  paymentMethod,
  manualRecipientName = null,
  options = {},
) {
  try {
    // Validate Input
    let donation;
    try {
      donation = await readListingById(donationId);
    } catch (error) {
      if (error.message === "Donation not found") {
        throw new Error("This food listing is not active or unavailable.");
      }
      throw error;
    }

    if (!donation || donation.status !== "Active") {
      throw new Error("This food listing is not active or unavailable.");
    }
    if (donation.measurementUnit === "PerRequest") {
      throw new Error("Items marked 'Per Request' cannot be reserved online.");
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Quantity must be a positive number.");
    }
    if (donation.ration > 0 && quantity > donation.ration) {
      throw new Error(
        `You cannot reserve more than the allowed ration of ${donation.ration}.`,
      );
    }

    // Prevent Duplicate Reservations
    const existingReservation =
      await ReservationRepository.checkExistingReservation(
        recipientProfileId,
        donationId,
      );
    if (existingReservation) {
      throw new Error("You have already reserved this listing.");
    }

    // Handle Payments
    const totalPaid = donation.price > 0 ? donation.price * quantity : 0;
    const reservationId = randomUUID();

    if (totalPaid > 0 && paymentMethod === "Wallet") {
      try {
        await debit(userId, totalPaid, {
          type: TransactionType.FoodPurchase,
          method: "Wallet",
          relatedReservationId: reservationId,
        });
      } catch (error) {
        if (error.message === "Insufficient wallet balance") {
          throw new Error("Insufficient wallet balance.");
        }
        throw error;
      }
    }

    // Stock Deduction
    let reservationApplication;
    try {
      reservationApplication = await applyReservation(
        donationId,
        quantity,
        totalPaid,
      );
    } catch {
      throw new Error("Insufficient stock or donation not found.");
    }

    try {
      // Save Reservation Ticket
      const reservationData = {
        _id: reservationId,
        donationId,
        recipientProfileId,
        manualRecipientName,
        quantity,
        status: "Reserved",
        paymentMethod: paymentMethod,
        totalPaid: totalPaid,
        ...(options.stripeSessionId
          ? { stripeSessionId: options.stripeSessionId }
          : {}),
      };

      const newReservation =
        await ReservationRepository.createReservation(reservationData);

      // Trigger Real-Time "Sold Out" Notification if stock is depleted
      if (reservationApplication.soldOut) {
        const createdNotification = await notification.notifyListingSoldOut(
          reservationApplication.soldOutAlert,
        );
        notification.publishCreatedNotifications(createdNotification);
      }

      return newReservation;
    } catch (error) {
      // Restore food stock and refund wallet if the database fails to save the ticket
      await restoreReservationQuantity(donationId, quantity);
      if (totalPaid > 0 && paymentMethod === "Wallet") {
        await credit(userId, totalPaid, {
          type: TransactionType.FoodPurchase,
          method: "Wallet",
          relatedReservationId: reservationId,
        });
      }
      throw new Error(`Failed to create reservation ticket: ${error.message}`);
    }
  } catch (error) {
    throw new Error(`Failed to create reservation ticket: ${error.message}`);
  }
}

export async function getHistory(recipientProfileId) {
  return await ReservationRepository.getReservationsByRecipient(
    recipientProfileId,
  );
}

export async function createReservationCheckout(
  userId,
  recipientProfileId,
  donationId,
  quantity
) {
  // 1. Verify the donation using the authorized interface
  let donation;
  try {
    donation = await readListingById(donationId);
  } catch (error) {
    if (error.message === "Donation not found") {
      throw new Error("This food listing is not active or unavailable.");
    }
    throw error;
  }

  // 2. Validate business rules (Active, PerRequest, Ration, Stock)
  if (!donation || donation.status !== "Active") {
    throw new Error("This food listing is not active or unavailable.");
  }
  if (donation.measurementUnit === "PerRequest") {
    throw new Error("Items marked 'Per Request' cannot be reserved online.");
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive number.");
  }
  if (donation.ration > 0 && quantity > donation.ration) {
    throw new Error(`You cannot reserve more than the allowed ration of ${donation.ration}.`);
  }
  if (quantity > donation.remainingQuantity) {
    throw new Error("Insufficient stock.");
  }

  const existingReservation =
    await ReservationRepository.checkExistingReservation(
      recipientProfileId,
      donationId,
    );
  if (existingReservation) {
    throw new Error("You have already reserved this listing.");
  }

  // 3. Calculate total price and ensure it's not a free item
  const totalPaid = donation.price > 0 ? donation.price * quantity : 0;
  if (totalPaid === 0) {
    throw new Error("Free items do not require a card payment.");
  }

  // 4. Generate the Stripe Checkout Session via the Payments Facade
  return paymentsFacade.createCheckoutSession({
    purpose: "reservation", 
    userId,
    amountVnd: totalPaid,
    productName: `Reservation: ${donation.name}`,
    successPath: "/history", 
    cancelPath: "/history",
    // Passing this data so the webhook knows exactly what to reserve once paid
    metadata: {
      donationId,
      quantity: String(quantity),
      recipientProfileId: String(recipientProfileId)
    }
  });
}

/** Fulfil one paid Stripe Checkout Session. Safe to call again on retries. */
export async function fulfillReservationCheckout(session) {
  const stripeSessionId = session?.id;
  if (!stripeSessionId) {
    throw new Error("Stripe session ID is missing.");
  }

  const fulfilledReservation =
    await ReservationRepository.findByStripeSessionId(stripeSessionId);
  if (fulfilledReservation) return fulfilledReservation;

  if (session.payment_status !== "paid") {
    throw new Error("Stripe checkout session is not paid.");
  }

  const { donationId, recipientProfileId, userId } = session.metadata ?? {};
  const quantity = Number(session.metadata?.quantity);
  if (!donationId || !recipientProfileId || !userId) {
    throw new Error("Reservation checkout metadata is incomplete.");
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Reservation checkout quantity is invalid.");
  }

  try {
    return await processReservation(
      recipientProfileId,
      userId,
      donationId,
      quantity,
      "Card",
      "Self",
      { stripeSessionId },
    );
  } catch (error) {
    // A concurrent delivery may have completed while this one was running.
    const concurrentReservation =
      await ReservationRepository.findByStripeSessionId(stripeSessionId);
    if (concurrentReservation) return concurrentReservation;
    throw error;
  }
}
