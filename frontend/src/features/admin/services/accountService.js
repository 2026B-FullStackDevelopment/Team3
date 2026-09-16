import { httpClient } from '@/shared/api/apiFetch.js'
import { adminRoutes } from '@/config/api/routes/index.js'

/**
 * Admin Service layer — User Management (SRS 7.1.1). Query plus the two
 * mutation calls; wiring them into the UI and any audit-log undo logic are
 * later branches (out of scope here).
 */
export const accountService = {
  getAccounts: ({ search, status, role, page, pageSize } = {}) =>
    httpClient.get(adminRoutes.accounts, { params: { search, status, role, page, pageSize } }),
  deactivateAccount: (accountId) => httpClient.patch(adminRoutes.deactivateAccount(accountId)),
  reactivateAccount: (accountId) => httpClient.patch(adminRoutes.reactivateAccount(accountId)),
}
