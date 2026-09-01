import * as auditLogService from "../services/auditLog.service.js";

/**
 * Thin HTTP layer: pulls params out of the request, hands them to the
 * service, sends the result. No business logic here -- validation, DTO
 * shaping, and error types all live in auditLog.service.js. Handlers are
 * async and un-try/catched on purpose: Express 5 forwards a rejected async
 * handler to errorHandler (middleware/error.js) automatically.
 */

/**
 * GET /api/admin/audit-logs
 * Query: targetType, status, adminId, startDate, endDate, page, limit
 */
export async function listAuditLogs(req, res) {
  const result = await auditLogService.listAuditLogs(req.query);
  res.status(200).json(result);
}

/**
 * GET /api/admin/audit-logs/:id
 */
export async function getAuditLogById(req, res) {
  const entry = await auditLogService.getAuditLogById(req.params.id);
  res.status(200).json(entry);
}

/**
 * POST /api/admin/audit-logs/:id/undo
 * actorId comes from the authenticated admin, not the request body, so a
 * caller can't undo an action and attribute it to someone else.
 */
export async function undoAuditLogAction(req, res) {
  const entry = await auditLogService.undoAction(req.params.id, req.user.userId);
  res.status(200).json(entry);
}

/**
 * GET /api/admin/accounts
 * Query: role, page, limit
 */
export async function listAccounts(req, res) {
  const result = await auditLogService.listAccounts(req.query);
  res.status(200).json(result);
}

/**
 * PATCH /api/admin/accounts/:userId/deactivate
 * adminId comes from the authenticated admin, not the request body, for the
 * same reason as undoAuditLogAction above.
 */
export async function deactivateUserAccount(req, res) {
  const account = await auditLogService.deactivateUserAccount(
    req.user.userId,
    req.params.userId,
  );
  res.status(200).json(account);
}

/**
 * PATCH /api/admin/accounts/:userId/reactivate
 */
export async function reactivateUserAccount(req, res) {
  const account = await auditLogService.reactivateUserAccount(
    req.user.userId,
    req.params.userId,
  );
  res.status(200).json(account);
}

/**
 * PATCH /api/admin/donations/:donationId/cancel
 */
export async function cancelDonation(req, res) {
  const donation = await auditLogService.cancelDonation(
    req.user.userId,
    req.params.donationId,
  );
  res.status(200).json(donation);
}
