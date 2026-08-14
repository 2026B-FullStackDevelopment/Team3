import { Router } from "express";
import * as donorListingController from "../controllers/donorListing.js";

/**
 * Donor dashboard routes, mounted at `/api/donor/food-listings`.
 *
 * TODO: once `middleware/auth.ts`, `role.ts` and `ownership.ts` are written,
 * this router needs `requireAuth` + `requireRole("donor")` applied to every
 * route, and `requireListingOwnership` on every `/:id` route. Without those,
 * these endpoints have no owner scoping at all.
 *
 * TODO: `middleware/validation.ts` + `validators/donorListing.ts` supply the
 * body/query parsing for the write routes.
 */
// Annotated for the same `declaration: true` reason as in `app.ts`.
const router: Router = Router();

// Collection.
router.get("/", donorListingController.listFoodListings);
router.post("/", donorListingController.createFoodListing);

// Static segments must be registered before `/:id`, otherwise Express matches
// "statistics" as an id and this route becomes unreachable.
router.get("/statistics", donorListingController.getListingStatistics);

// Single listing.
router.get("/:id", donorListingController.getFoodListing);
router.patch("/:id", donorListingController.updateFoodListing);
router.delete("/:id", donorListingController.deleteFoodListing);

// Listing sub-resources and actions.
router.post("/:id/duplicate", donorListingController.duplicateFoodListing);
router.get("/:id/donations", donorListingController.listListingDonations);
router.post("/:id/donations", donorListingController.recordListingDonation);
router.patch("/:id/status", donorListingController.updateListingStatus);
router.patch("/:id/ration", donorListingController.updateListingRation);

export default router;
