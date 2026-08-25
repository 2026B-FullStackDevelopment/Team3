import { Router } from "express";

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
} from "../controllers/donorListing.js";

export const donorListingRoutes = Router();

donorListingRoutes.route("/").get(listFoodListings).post(createFoodListing);

donorListingRoutes.post("/:id/duplicate", duplicateFoodListing);
donorListingRoutes.get("/:id/donations", listFoodListingDonations);
donorListingRoutes.patch("/:id/status", updateListingStatus);
donorListingRoutes.patch("/:id/ration", updateListingRation);

donorListingRoutes
  .route("/:id")
  .get(getFoodListing)
  .patch(updateFoodListing)
  .delete(deleteFoodListing);
