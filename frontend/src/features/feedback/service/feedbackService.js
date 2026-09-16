import { apiFetch } from '@/shared/api/apiFetch.js'
import { feedbackRoutes } from '@/config/api/routes/index.js'

export const feedbackService = {
  /** Submits text feedback on a collected reservation (SRS 5.2.4). */
  async submit(reservationId, feedback) {
    const payload = await apiFetch(feedbackRoutes.submit(reservationId), {
      method: 'POST',
      body: { feedback },
    })
    return payload?.reservation
  },
}
