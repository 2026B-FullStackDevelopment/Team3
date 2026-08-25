import { Router } from "express";
import { requireRole } from "../../../middleware/role.js";
import * as auditLogController from "../controllers/auditLog.controller.js";

/**
 * All audit log routes are Admin-only (SRS 7/8, A.2.3) -- guarded here at
 * the route layer rather than per-handler, so a new endpoint can't be added
 * later without the guard by accident.
 */
export const auditLogRoutes = Router();

auditLogRoutes.use(requireRole("Admin"));

auditLogRoutes.get("/", auditLogController.listAuditLogs);
auditLogRoutes.get("/:id", auditLogController.getAuditLogById);
auditLogRoutes.post("/:id/undo", auditLogController.undoAuditLogAction);
