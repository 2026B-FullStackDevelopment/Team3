import { httpClient } from '@/shared/api/apiFetch.js'
import { adminRoutes } from '@/config/api/routes/index.js'

/**
 * Admin Service layer — Listing Moderation (SRS 7.3.1/7.3.2). Query plus the
 * cancel mutation call; wiring it into the UI and any audit-log undo logic
 * are later branches (out of scope here). Named after the backend resource
 * (`adminRoutes.donations` -> GET /api/admin/donations) rather than the UI's
 * "Listing Moderation" label — see admin.routes.js's comment — but
 * cancelListing keeps this file's own UI-facing naming, matching getListings.
 */
export const donationService = {
  getListings: ({ search, page, pageSize } = {}) =>
    httpClient.get(adminRoutes.donations, { params: { search, page, pageSize } }),
  cancelListing: (listingId) => httpClient.patch(adminRoutes.cancelDonation(listingId)),
}
