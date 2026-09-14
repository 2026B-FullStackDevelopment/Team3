import { apiFetch } from '@/lib/api/apiFetch.js'
import { reservationRoutes } from '@/config/api/routes/index.js'

export const reservationService = {
  /** Fetches the caller's own reservations, newest first. */
  async history(signal) {
    const payload = await apiFetch(reservationRoutes.history, { signal })
    return payload?.history ?? []
  },
}
