import * as donorListingService from "../services/donation.service.js";
import { toRecipientListingDTO } from "../dtos/donation.dto.js";

export async function getActiveDonations(req, res, next) {
  try {
    // Passes frontend query params (like search, category, page) to the service
    const result = await donorListingService.listActiveDonations(req.query);
    const totalPages = Math.ceil(result.total / result.limit);

    res.status(200).json({
      entries: result.entries.map(toRecipientListingDTO),
      metadata: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages,
        hasNextPage: result.page < totalPages,
        hasPreviousPage: result.page > 1,
        sortBy: result.sortBy,
        sortOrder: result.sortOrder,
      },
    });
  } catch (error) {
    next(error);
  }
}
