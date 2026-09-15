import { useMutation } from "@tanstack/react-query";
import { feedbackService } from "@/features/feedback/service/feedbackService.js";

function isCollected(status) {
  return status === "Collected" || status === "CollectedByRecipient";
}

/** Submits feedback; the calling Reservation view updates its history afterward. */
export function useSubmitFeedback() {
  return useMutation({
    mutationFn: ({ reservationId, feedback }) =>
      feedbackService.submit(reservationId, feedback),
  });
}

/**
 * Behavior for one collection-history row (SRS A.3.b: keep the row's
 * behavior out of its presentation, so the row component can stay a plain
 * presentational component and this hook can be swapped/tested on its own).
 */
export function useFeedbackRow(entry, { onSuccess } = {}) {
  const submitFeedback = useSubmitFeedback();

  function submit(text) {
    submitFeedback.mutate(
      { reservationId: entry.id, feedback: text },
      {
        onSuccess: (reservation) => onSuccess?.(reservation, text),
      },
    );
  }

  return {
    canLeaveFeedback: isCollected(entry.status) && !entry.feedback,
    submit,
    isSubmitting: submitFeedback.isPending,
    error: submitFeedback.error?.message,
  };
}
