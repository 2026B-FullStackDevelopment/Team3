import { ValidationError } from "../../../shared/errors/errors.js";

const MAX_FEEDBACK_LENGTH = 1000;

/** SRS 5.2.4 only asks for free-form text — non-empty and length-capped is enough. */
export function validateFeedbackText(body = {}) {
  const { feedback } = body;

  if (typeof feedback !== "string" || feedback.trim() === "") {
    throw new ValidationError("Feedback text is required");
  }
  if (feedback.trim().length > MAX_FEEDBACK_LENGTH) {
    throw new ValidationError(
      `Feedback must be at most ${MAX_FEEDBACK_LENGTH} characters`,
    );
  }

  return feedback.trim();
}
