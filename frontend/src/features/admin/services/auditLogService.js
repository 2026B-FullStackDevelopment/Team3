import { httpClient } from '@/config/api/httpClient.js'
import { adminRoutes } from '@/config/api/routes/index.js'
import { accountService } from '@/features/admin/services/accountService.js'

/**
 * Admin Service layer — Audit Log (SRS §8).
 */
export const auditLogService = {
  getAuditLogs: ({ search, status, actionType, page, pageSize } = {}) =>
    httpClient.get(adminRoutes.auditLogs, { params: { search, status, actionType, page, pageSize } }),

  /**
   * Undo is deliberately NOT symmetric between the two action families.
   * A user action (Deactivate/Reactivate) is low-stakes enough that undo
   * just calls its direct inverse through accountService -- the exact same
   * functions User Management's own buttons call, not a separate "undo"
   * endpoint. A listing cancellation has cascading consequences (see the
   * donation module), so it can only ever be reversed through the
   * dedicated audit-log undo endpoint -- there is intentionally no
   * "reactivate listing" call anywhere to call instead.
   */
  undoAuditLogEntry: ({ id, action, targetId }) => {
    if (action === 'DeactivateUser') return accountService.reactivateAccount(targetId)
    if (action === 'ReactivateUser') return accountService.deactivateAccount(targetId)
    return httpClient.post(adminRoutes.undo(id))
  },
}
