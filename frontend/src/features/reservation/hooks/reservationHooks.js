import { useQuery } from '@tanstack/react-query'
import { reservationService } from '@/features/reservation/service/reservationService.js'
import { formatReservation } from '@/features/reservation/models/reservationModel.js'

export const reservationKeys = {
  history: ['reservations', 'history'],
}

/** Fetches and caches the Recipient's own collection history (SRS 5.1.4). */
export function useCollectionHistory() {
  return useQuery({
    queryKey: reservationKeys.history,
    queryFn: ({ signal }) => reservationService.history(signal),
    select: (entries) => entries.map(formatReservation),
  })
}
