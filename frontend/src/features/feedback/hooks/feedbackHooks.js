import { useMutation, useQueryClient } from '@tanstack/react-query'
import { feedbackService } from '@/features/feedback/service/feedbackService.js'
import { reservationKeys } from '@/features/reservation/hooks/reservationHooks.js'

/** Submits feedback and refreshes the Recipient's collection history afterward. */
export function useSubmitFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reservationId, feedback }) =>
      feedbackService.submit(reservationId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.history })
    },
  })
}

/**
 * Behavior for one collection-history row (SRS A.3.b: keep the row's
 * behavior out of its presentation, so the row component can stay a plain
 * presentational component and this hook can be swapped/tested on its own).
 */
export function useFeedbackRow(entry) {
  const submitFeedback = useSubmitFeedback()

  function submit(text) {
    submitFeedback.mutate({ reservationId: entry.id, feedback: text })
  }

  return {
    canLeaveFeedback: !entry.feedback,
    submit,
    isSubmitting: submitFeedback.isPending,
    error: submitFeedback.error?.message,
  }
}
