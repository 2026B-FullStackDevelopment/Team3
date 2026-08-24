import type { Request, Response } from "express";

/**
 * Donor dashboard controllers.
 *
 * Skeleton only — every handler answers 501 until the service layer exists.
 * Each stub documents the contract the implementation must honour so the
 * frontend can be built against it in parallel.
 */

function notImplemented(res: Response, handler: string) {
  res.status(501).json({
    error: "NOT_IMPLEMENTED",
    message: `${handler} is not implemented yet.`,
  });
}

/**
 * GET /api/donor/food-listings
 *
 * Paginated listings owned by the authenticated donor — the dashboard table.
 * Query: page, limit, status[], category[], search, sort, order.
 */
export function listFoodListings(_req: Request, res: Response) {
  notImplemented(res, "listFoodListings");
}

/**
 * POST /api/donor/food-listings
 *
 * Create a listing. Body decides draft vs published.
 */
export function createFoodListing(_req: Request, res: Response) {
  notImplemented(res, "createFoodListing");
}

/**
 * GET /api/donor/food-listings/statistics
 *
 * Dashboard totals and time series for charts.
 * Query: from, to, interval (day|week|month).
 *
 * MUST stay registered before `/:id` or Express matches "statistics" as an id.
 */
export function getListingStatistics(_req: Request, res: Response) {
  notImplemented(res, "getListingStatistics");
}

/**
 * GET /api/donor/food-listings/:id
 *
 * One listing owned by the donor.
 */
export function getFoodListing(_req: Request, res: Response) {
  notImplemented(res, "getFoodListing");
}

/**
 * PATCH /api/donor/food-listings/:id
 *
 * Partial edit of listing details. Status and ration limit have their own
 * endpoints and are not editable here.
 */
export function updateFoodListing(_req: Request, res: Response) {
  notImplemented(res, "updateFoodListing");
}

/**
 * DELETE /api/donor/food-listings/:id
 *
 * Remove a listing. Should refuse (409) once donations or reservations exist —
 * cancel via the status endpoint instead, so records keep their parent.
 */
export function deleteFoodListing(_req: Request, res: Response) {
  notImplemented(res, "deleteFoodListing");
}

/**
 * POST /api/donor/food-listings/:id/duplicate
 *
 * New listing reusing the source configuration. Progress (donated/claimed
 * amounts, records) is not copied. Body may override scheduling and quantity.
 */
export function duplicateFoodListing(_req: Request, res: Response) {
  notImplemented(res, "duplicateFoodListing");
}

/**
 * GET /api/donor/food-listings/:id/donations
 *
 * Combined feed of donation and reservation records for the listing.
 * Query: page, limit, type (donation|reservation).
 */
export function listListingDonations(_req: Request, res: Response) {
  notImplemented(res, "listListingDonations");
}

/**
 * POST /api/donor/food-listings/:id/donations
 *
 * Manually record food handed to a recipient. Must reject amounts above the
 * remaining quantity, and above the ration limit once the recipient's earlier
 * donations on this listing are counted.
 */
export function recordListingDonation(_req: Request, res: Response) {
  notImplemented(res, "recordListingDonation");
}

/**
 * PATCH /api/donor/food-listings/:id/status
 *
 * Pause / resume / cancel / publish / complete. Enforce the state machine —
 * completed, cancelled and expired are terminal.
 */
export function updateListingStatus(_req: Request, res: Response) {
  notImplemented(res, "updateListingStatus");
}

/**
 * PATCH /api/donor/food-listings/:id/ration
 *
 * Set or clear the per-recipient ration limit. `null` clears it.
 */
export function updateListingRation(_req: Request, res: Response) {
  notImplemented(res, "updateListingRation");
}
