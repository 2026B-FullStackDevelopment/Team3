/** Admin / audit API routes (SRS A.2.a). Skeleton — built with the Admin module. */
export const adminRoutes = {
  auditLogs: '/api/admin/audit-logs',
  auditLog: (id) => `/api/admin/audit-logs/${id}`,
  undo: (id) => `/api/admin/audit-logs/${id}/undo`,
  accounts: '/api/admin/accounts',
  deactivateAccount: (userId) => `/api/admin/accounts/${userId}/deactivate`,
  reactivateAccount: (userId) => `/api/admin/accounts/${userId}/reactivate`,
  cancelDonation: (donationId) => `/api/admin/donations/${donationId}/cancel`,
}
