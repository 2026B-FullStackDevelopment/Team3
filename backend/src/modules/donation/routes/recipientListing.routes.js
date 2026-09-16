import { Router } from "express";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role.js";
import { userRole } from "../../identity/index.js";
import {
  getActiveDonation,
  getActiveDonations,
} from "../controllers/recipientListing.controller.js";

export const recipientListingRoutes = Router();

// GET /api/donations/active
recipientListingRoutes.use(requireAuth, requireRole(userRole.Recipient));
recipientListingRoutes.get("/active", getActiveDonations);
recipientListingRoutes.get("/active/:id", getActiveDonation);
