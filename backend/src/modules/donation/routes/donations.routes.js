import { randomUUID } from "node:crypto";
import { Router } from "express";

import { requireAuth } from "../../../middleware/auth.js";
import { loadDonorProfile } from "../../../middleware/donorProfile.js";
import { requireRole } from "../../../middleware/role.js";
import { uploadImage } from "../../../middleware/uploadImage.js";
import { userRole } from "../../identity/index.js";

import {
  collectFoodListingReservation,
  createFoodListing,
  deleteFoodListing,
  duplicateFoodListing,
  getFoodListing,
  listFoodListingDonations,
  listFoodListings,
  updateFoodListing,
  updateListingRation,
  updateListingStatus,
} from "../controllers/donation.controller.js";
import { manualDonationRoutes } from "./manualDonation.routes.js";

export const donorListingRoutes = Router();

const donationImageUpload = uploadImage({
  fieldName: "image",
  folder: "donations",
  maxBytes: 5 * 1024 * 1024,
  required: true,
  keyFor: () => `donations/${Date.now()}-${randomUUID()}`,
});

donorListingRoutes.use(
  requireAuth,
  requireRole(userRole.Donor),
  loadDonorProfile,
);

// Donation creation is multipart/form-data and must include one `image` file.
donorListingRoutes
  .route("/")
  .get(listFoodListings)
  .post(donationImageUpload, createFoodListing);

donorListingRoutes.post("/:id/duplicate", duplicateFoodListing);
donorListingRoutes.get("/:id/donations", listFoodListingDonations);
donorListingRoutes.patch(
  "/:id/donations/:reservationId/collect",
  collectFoodListingReservation,
);
donorListingRoutes.use("/:id/manual-donations", manualDonationRoutes);
donorListingRoutes.patch("/:id/status", updateListingStatus);
donorListingRoutes.patch("/:id/ration", updateListingRation);

donorListingRoutes
  .route("/:id")
  .get(getFoodListing)
  .patch(updateFoodListing)
  .delete(deleteFoodListing);
