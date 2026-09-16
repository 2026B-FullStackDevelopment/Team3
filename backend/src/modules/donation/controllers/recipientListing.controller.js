import * as donorListingService from "../services/donation.service.js";
import {
  toRecipientListingDetailDTO,
  toRecipientListingDTO,
} from "../dtos/donation.dto.js";

export async function getActiveDonations(req, res, next) {
  try {
    // Passes frontend query params (like search, category, page) to the service
    const result = await donorListingService.listActiveDonations(
      req.user.userId,
      req.query,
    );
    res.status(200).json({
      ...result,
      entries: result.entries.map(toRecipientListingDTO),
    });
  } catch (error) {
    next(error);
  }
}

export async function getActiveDonation(req, res, next) {
  try {
    const listing = await donorListingService.getActiveDonation(req.params.id);
    res.status(200).json({ listing: toRecipientListingDetailDTO(listing) });
  } catch (error) {
    next(error);
  }
}
