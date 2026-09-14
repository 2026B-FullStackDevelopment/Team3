import * as reservationRepository from "../../reservation/repositories/ReservationRepository.js";
import { NotFoundError } from "../../../shared/errors/errors.js";

/**
 * The repository's ownership+status filter already does the eligibility
 * check in one query, so a null result covers "not found", "not yours", and
 * "not collected yet" alike — reported as one generic 404 since SRS 5.2.4
 * doesn't call for finer-grained error cases.
 */
export async function submitFeedback(reservationId, recipientProfileId, feedbackText) {
  const updated = await reservationRepository.submitFeedback(
    reservationId,
    recipientProfileId,
    feedbackText,
  );

  if (!updated) {
    throw new NotFoundError("Reservation not found or not eligible for feedback");
  }

  return updated;
}
