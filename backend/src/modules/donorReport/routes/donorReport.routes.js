import { Router } from "express";

import { requireAuth } from "../../../middleware/auth.js";
import { loadDonorProfile } from "../../../middleware/donorProfile.js";
import { requireRole } from "../../../middleware/role.js";
import { userRole } from "../../identity/index.js";
import { getDashboardReport } from "../controllers/donorReport.controller.js";

export const donorReportRoutes = Router();

donorReportRoutes.use(
  requireAuth,
  requireRole(userRole.Donor),
  loadDonorProfile,
);
donorReportRoutes.get("/dashboard", getDashboardReport);
