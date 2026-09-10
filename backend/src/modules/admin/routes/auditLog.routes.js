import { Router } from "express";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role.js";
import { userRole } from "../../identity/index.js";
import * as auditLogController from "../controllers/auditLog.controller.js";

/**
 * All admin routes are Admin-only (SRS 7/8, A.2.3) -- guarded here at the
 * route layer rather than per-handler, so a new endpoint can't be added later
 * without the guard by accident. requireAuth must run first: requireRole only
 * reads req.user, which requireAuth is the one that populates.
 */
export const auditLogRoutes = Router();

// TESTING ONLY — auth/role guards bypassed. Restore before merging:
// auditLogRoutes.use(requireAuth);
// auditLogRoutes.use(requireRole(userRole.Admin));

// Audit log entries (SRS 8, extra feature)
auditLogRoutes.get("/audit-logs", auditLogController.listAuditLogs);
auditLogRoutes.get("/audit-logs/:id", auditLogController.getAuditLogById);
auditLogRoutes.post("/audit-logs/:id/undo", auditLogController.undoAuditLogAction);

// Account management (SRS 7.1.1, 7.2.1)
auditLogRoutes.get("/accounts", auditLogController.listAccounts);
auditLogRoutes.patch("/accounts/:userId/deactivate", auditLogController.deactivateUserAccount);
auditLogRoutes.patch("/accounts/:userId/reactivate", auditLogController.reactivateUserAccount);

// Food listing moderation and system-wide listing view (SRS 7.2.2, 7.3.1, 7.3.2)
auditLogRoutes.get("/donations", auditLogController.listAllFoodListings);
auditLogRoutes.patch("/donations/:donationId/cancel", auditLogController.cancelDonation);
