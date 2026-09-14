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
