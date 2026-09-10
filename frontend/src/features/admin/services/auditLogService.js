import { httpClient } from '@/config/api/httpClient.js'
import { adminRoutes } from '@/config/api/routes/index.js'

/**
 * Admin Service layer — Audit Log (SRS §8). Query-only for now; undo is a
 * later branch (out of scope here).
 */
export const auditLogService = {
  getAuditLogs: ({ search, status, actionType, page, pageSize } = {}) =>
    httpClient.get(adminRoutes.auditLogs, { params: { search, status, actionType, page, pageSize } }),
}
