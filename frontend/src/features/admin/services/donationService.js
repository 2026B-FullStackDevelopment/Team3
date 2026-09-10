import { httpClient } from '@/config/api/httpClient.js'
import { adminRoutes } from '@/config/api/routes/index.js'

/**
 * Admin Service layer — Listing Moderation (SRS 7.3.1/7.3.2). Query-only for
 * now; cancel is a later branch (out of scope here). Named after the backend
 * resource (`adminRoutes.donations` -> GET /api/admin/donations) rather than
 * the UI's "Listing Moderation" label — see admin.routes.js's comment.
 */
export const donationService = {
  getListings: ({ search, page, pageSize } = {}) =>
    httpClient.get(adminRoutes.donations, { params: { search, page, pageSize } }),
}
