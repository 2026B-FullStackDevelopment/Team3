import * as feedbackService from "../services/feedback.js";
import { validateFeedbackText } from "../validators/feedback.js";
import { RecipientProfile } from "../../identity/models/RecipientProfile.js";
import { UnauthorizedError } from "../../../shared/errors/errors.js";

/**
 * POST /api/feedback/reservations/:reservationId
 * Recipient-only; resolves the caller's RecipientProfile from the JWT the
 * same way reservationControllers.js does.
 */
export async function submitFeedback(req, res, next) {
  try {
    const feedbackText = validateFeedbackText(req.body);

    const recipientProfile = await RecipientProfile.findOne({ userId: req.user.userId });
    if (!recipientProfile) {
      throw new UnauthorizedError("Recipient profile not found");
    }

    const reservation = await feedbackService.submitFeedback(
      req.params.reservationId,
      recipientProfile._id,
      feedbackText,
    );

    res.status(200).json({ reservation });
  } catch (error) {
    next(error);
  }
}
