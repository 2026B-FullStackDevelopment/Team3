import { Router } from "express";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role.js";
import { userRole } from "../../identity/index.js";
import { getActiveDonations } from "../controllers/recipientListing.controller.js";

export const recipientListingRoutes = Router();

// GET /api/donations/active
recipientListingRoutes.get(
  "/active",
  requireAuth,
  requireRole(userRole.Recipient),
  getActiveDonations,
);
