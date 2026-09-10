import { httpClient } from '@/config/api/httpClient.js'
import { adminRoutes } from '@/config/api/routes/index.js'

/**
 * Admin Service layer — User Management (SRS 7.1.1). Query-only for now;
 * deactivate/reactivate are a later branch (out of scope here).
 */
export const accountService = {
  getAccounts: ({ search, status, role, page, pageSize } = {}) =>
    httpClient.get(adminRoutes.accounts, { params: { search, status, role, page, pageSize } }),
}
