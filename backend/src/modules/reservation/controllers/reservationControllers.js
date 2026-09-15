import * as ReservationService from "../services/reservationService.js";
import { RecipientProfile } from "../../identity/models/RecipientProfile.js";

/**
 * POST /api/reservations
 * Take input from the frontend and passes it to the Service
 */
export async function createReservation(req, res, next) {
  try {
    // Unpack the data sent from the React frontend
    const { donationId, quantity, paymentMethod, manualRecipientName } =
      req.body;

    const recipientProfile = await RecipientProfile.findOne({
      userId: req.user.userId,
    });

    if (!recipientProfile) {
      return res
        .status(401)
        .json({
          error: "UNAUTHENTICATED",
          message: "Recipient profile ID is missing.",
        });
    }

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
    const recipientProfile = await RecipientProfile.findOne({
      userId: req.user.userId,
    });

    if (!recipientProfile) {
      return res
        .status(401)
        .json({
          error: "UNAUTHENTICATED",
          message: "Recipient profile ID is missing.",
        });
    }

    const recipientProfileId = recipientProfile._id;

    const history = await ReservationService.getHistory(recipientProfileId);

    res.status(200).json({ history });
  } catch (error) {
    next(error);
  }
}
