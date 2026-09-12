import * as donorListingService from "../services/donorListing.service.js";

export async function getActiveDonations(req, res, next) {
  try {
    // Passes frontend query params (like search, category, page) to the service
    const result = await donorListingService.listActiveDonations(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}