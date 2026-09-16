import { httpClient, unwrapHttpResponse } from '@/shared/api/apiFetch.js'
import { feedbackRoutes } from '@/config/api/routes/index.js'

export const feedbackService = {
  /** Submits text feedback on a collected reservation (SRS 5.2.4). */
  async submit(reservationId, feedback) {
    const payload = unwrapHttpResponse(
      await httpClient.post(feedbackRoutes.submit(reservationId), { feedback }),
    )
    return payload?.reservation
  },
}
