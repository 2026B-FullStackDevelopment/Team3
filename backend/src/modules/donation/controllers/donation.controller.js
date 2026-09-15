import * as donorListingService from "../services/donation.service.js";
import { toDonorListingDTO } from "../dtos/donation.dto.js";
import { deleteObject } from "../../../shared/upload/services/objectStore.js";

function getDonorProfileId(req) {
  return req.user?.donorProfileId;
}

function requireDonorProfileId(req, res) {
  const donorProfileId = getDonorProfileId(req);

  if (!donorProfileId) {
    res.status(401).json({
      error: "UNAUTHENTICATED",
      message: "An authenticated donor profile is required",
    });
    return null;
  }

  return String(donorProfileId);
}

function parseBoolean(value, defaultValue) {
  if (value === undefined) return defaultValue;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}

/** GET /api/donor/food-listings */
export async function listFoodListings(req, res, next) {
  try {
    const donorProfileId = requireDonorProfileId(req, res);
    if (!donorProfileId) return;

    const result = await donorListingService.listDonorDonations(
      donorProfileId,
      {
        ...req.query,
        includeClosed: parseBoolean(req.query.includeClosed, true),
      },
    );
    const totalPages = Math.ceil(result.total / result.limit);

    res.status(200).json({
      entries: result.entries.map(toDonorListingDTO),
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

/** POST /api/donor/food-listings */
export async function createFoodListing(req, res, next) {
  let listing;
  try {
    const donorProfileId = requireDonorProfileId(req, res);
    if (!donorProfileId) {
      await deleteObject(req.file?.publicUrl);
      return;
    }

    // imageUrl comes only from the server-controlled upload result; a caller
    // cannot bypass the required file by putting an arbitrary URL in req.body.
    listing = await donorListingService.createDonation(donorProfileId, {
      ...req.body,
      imageUrl: req.file.publicUrl,
    });

    res.status(201).json({
      listing: toDonorListingDTO(listing),
    });
  } catch (error) {
    // If validation or persistence failed, the uploaded file has no DB owner.
    if (!listing) await deleteObject(req.file?.publicUrl);
    next(error);
  }
}

/** GET /api/donor/food-listings/:id */
export async function getFoodListing(req, res, next) {
  try {
    const donorProfileId = requireDonorProfileId(req, res);
    if (!donorProfileId) return;

    const listing = await donorListingService.getOwnedDonation(
      req.params.id,
      donorProfileId,
    );

    res.status(200).json({
      listing: toDonorListingDTO(listing),
    });
  } catch (error) {
    next(error);
  }
}

/** GET /api/donor/food-listings/:id/donations */
export async function listFoodListingDonations(req, res, next) {
  try {
    const donorProfileId = requireDonorProfileId(req, res);
    if (!donorProfileId) return;

    const result = await donorListingService.listFoodListingDonations(
      req.params.id,
      donorProfileId,
      req.query,
    );
    const totalPages = Math.ceil(result.total / result.limit);

    res.status(200).json({
      entries: result.entries,
      metadata: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages,
        hasNextPage: result.page < totalPages,
        hasPreviousPage: result.page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/** PATCH /api/donor/food-listings/:id */
export async function updateFoodListing(req, res, next) {
  try {
    const donorProfileId = requireDonorProfileId(req, res);
    if (!donorProfileId) return;

    const listing = await donorListingService.updateDonation(
      req.params.id,
      donorProfileId,
      req.body,
    );

    res.status(200).json({
      listing: toDonorListingDTO(listing),
    });
  } catch (error) {
    next(error);
  }
}

/** DELETE /api/donor/food-listings/:id */
export async function deleteFoodListing(req, res, next) {
  try {
    const donorProfileId = requireDonorProfileId(req, res);
    if (!donorProfileId) return;

    await donorListingService.deleteDonation(req.params.id, donorProfileId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

/** PATCH /api/donor/food-listings/:id/status */
export async function updateListingStatus(req, res, next) {
  try {
    const donorProfileId = requireDonorProfileId(req, res);
    if (!donorProfileId) return;

    const listing = await donorListingService.changeDonationStatus(
      req.params.id,
      donorProfileId,
      req.body?.status,
    );

    res.status(200).json({
      listing: toDonorListingDTO(listing),
    });
  } catch (error) {
    next(error);
  }
}

/** PATCH /api/donor/food-listings/:id/ration */
export async function updateListingRation(req, res, next) {
  try {
    const donorProfileId = requireDonorProfileId(req, res);
    if (!donorProfileId) return;

    const listing = await donorListingService.updateDonationRation(
      req.params.id,
      donorProfileId,
      req.body?.ration,
    );

    res.status(200).json({
      listing: toDonorListingDTO(listing),
    });
  } catch (error) {
    next(error);
  }
}

/** POST /api/donor/food-listings/:id/duplicate */
export async function duplicateFoodListing(req, res, next) {
  try {
    const donorProfileId = requireDonorProfileId(req, res);
    if (!donorProfileId) return;

    const listing = await donorListingService.duplicateDonation(
      req.params.id,
      donorProfileId,
      req.body,
    );

    res.status(201).json({
      listing: toDonorListingDTO(listing),
    });
  } catch (error) {
    next(error);
  }
}
