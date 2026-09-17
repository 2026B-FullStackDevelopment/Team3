/** Admin / audit API routes (SRS A.2.a). Skeleton — built with the Admin module. */
export const adminRoutes = {
  auditLogs: '/api/admin/audit-logs',
  auditLog: (id) => `/api/admin/audit-logs/${id}`,
  undo: (id) => `/api/admin/audit-logs/${id}/undo`,
  accounts: '/api/admin/accounts',
  deactivateAccount: (userId) => `/api/admin/accounts/${userId}/deactivate`,
  reactivateAccount: (userId) => `/api/admin/accounts/${userId}/reactivate`,
  // System-wide food listing view for Listing Moderation (SRS 7.3.1/7.3.2).
  // Named "donations" to match the backend resource (auditLogRoutes.get('/donations', listAllFoodListings)),
  // even though the UI calls this view "Listing Moderation".
  donations: '/api/admin/donations',
  cancelDonation: (donationId) => `/api/admin/donations/${donationId}/cancel`,
}
