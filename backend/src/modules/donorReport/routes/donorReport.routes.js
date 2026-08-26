import { Router } from "express";

import { getDashboardReport } from "../controllers/donorReport.controller.js";

export const donorReportRoutes = Router();

donorReportRoutes.get("/dashboard", getDashboardReport);
