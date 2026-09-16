import { Router } from "express";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role.js";
import { userRole } from "../../identity/index.js";
import {
  getActiveDonation,
  getActiveDonations,
} from "../controllers/recipientListing.controller.js";

export const recipientListingRoutes = Router();

recipientListingRoutes.use(requireAuth, requireRole(userRole.Recipient));

// GET /api/donations/active
recipientListingRoutes.get("/active", getActiveDonations);

// GET /api/donations/active/:id
recipientListingRoutes.get("/active/:id", getActiveDonation);
