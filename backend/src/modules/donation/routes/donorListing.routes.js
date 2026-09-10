import { Router } from "express";

import { loadDonationDevelopmentDonor } from "../../../middleware/donationDevelopmentAccess.js";

// TODO(auth): Restore these imports with the protected middleware block below.
// import { requireAuth } from "../../../middleware/auth.js";
// import { loadDonorProfile } from "../../../middleware/donorProfile.js";
// import { requireRole } from "../../../middleware/role.js";
// import { userRole } from "../../identity/index.js";

import {
  createFoodListing,
  deleteFoodListing,
  duplicateFoodListing,
  getFoodListing,
  listFoodListingDonations,
  listFoodListings,
  updateFoodListing,
  updateListingRation,
  updateListingStatus,
} from "../controllers/donorListing.controller.js";
import { manualDonationRoutes } from "./manualDonation.routes.js";

export const donorListingRoutes = Router();

// TODO(auth): Restore this protected middleware block when Login is ready:
// donorListingRoutes.use(requireAuth, requireRole(userRole.Donor), loadDonorProfile);
donorListingRoutes.use(loadDonationDevelopmentDonor);

donorListingRoutes.route("/").get(listFoodListings).post(createFoodListing);

donorListingRoutes.post("/:id/duplicate", duplicateFoodListing);
donorListingRoutes.get("/:id/donations", listFoodListingDonations);
donorListingRoutes.use("/:id/manual-donations", manualDonationRoutes);
donorListingRoutes.patch("/:id/status", updateListingStatus);
donorListingRoutes.patch("/:id/ration", updateListingRation);

donorListingRoutes
  .route("/:id")
  .get(getFoodListing)
  .patch(updateFoodListing)
  .delete(deleteFoodListing);
