import * as ReservationService from "../services/reservationService.js";
import { loadRecipientProfile } from "../../identity/index.js";

async function requireRecipientProfile(req, res) {
  const recipientProfile = await loadRecipientProfile(req.user.userId);
  if (recipientProfile) return recipientProfile;

  res.status(401).json({
    error: "UNAUTHENTICATED",
    message: "Recipient profile ID is missing.",
  });
  return null;
}

/**
 * POST /api/reservations
 * Take input from the frontend and passes it to the Service
 */
export async function createReservation(req, res, next) {
  try {
    // Unpack the data sent from the React frontend
    const { donationId, quantity, paymentMethod, manualRecipientName } =
      req.body;

    const recipientProfile = await requireRecipientProfile(req, res);
    if (!recipientProfile) return;

    const recipientProfileId = recipientProfile._id;

    // Pass the unpacked data to service
    const newReservation = await ReservationService.processReservation(
      recipientProfileId,
      req.user.userId,
      donationId,
      quantity,
      paymentMethod,
      manualRecipientName,
    );

    //Send the successful receipt back to the frontend
    res.status(201).json({ reservation: newReservation });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reservations/history
 * Fetches the user's past reservations
 */
export async function getHistory(req, res, next) {
  try {
    const recipientProfile = await requireRecipientProfile(req, res);
    if (!recipientProfile) return;

    const recipientProfileId = recipientProfile._id;

    const history = await ReservationService.getHistory(recipientProfileId);

    res.status(200).json({ history });
  } catch (error) {
    next(error);
  }
}

/** GET /api/reservations/mine — pending and cancelled reservations. */
export async function getMyReservations(req, res, next) {
  try {
    const recipientProfile = await requireRecipientProfile(req, res);
    if (!recipientProfile) return;

    const reservations = await ReservationService.getMyReservations(
      recipientProfile._id,
    );
    res.status(200).json({ reservations });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/reservations/checkout
 * Generates a Stripe checkout URL for Card payments
 */
export async function createCheckoutSession(req, res, next) {
  try {
    const { donationId, quantity } = req.body;
    
    const recipientProfile = await requireRecipientProfile(req, res);
    if (!recipientProfile) return;

    const session = await ReservationService.createReservationCheckout(
      req.user.userId,
      recipientProfile._id,
      donationId,
      quantity
    );

    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
}
