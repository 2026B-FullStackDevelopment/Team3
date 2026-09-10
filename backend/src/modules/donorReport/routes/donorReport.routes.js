import { Router } from "express";

import { loadDonationDevelopmentDonor } from "../../../middleware/donationDevelopmentAccess.js";
import { getDashboardReport } from "../controllers/donorReport.controller.js";

export const donorReportRoutes = Router();

// TODO(auth): Replace with the shared donor authentication/profile middleware
// when Login is integrated. This keeps Donation reporting usable in dev only.
donorReportRoutes.use(loadDonationDevelopmentDonor);
donorReportRoutes.get("/dashboard", getDashboardReport);
