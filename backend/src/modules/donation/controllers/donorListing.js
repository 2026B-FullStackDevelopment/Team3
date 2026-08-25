import * as donorListingService from "../services/donorListing.js";

function getDonorProfileId(req, res) {
  return (
    req.user?.donorProfileId ??
    req.auth?.donorProfileId ??
    res.locals?.donorProfileId
  );
}

function requireDonorProfileId(req, res) {
  const donorProfileId = getDonorProfileId(req, res);

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

    const entries = await donorListingService.listDonorDonations(
      donorProfileId,
      {
        includeClosed: parseBoolean(req.query.includeClosed, true),
      },
    );

    res.status(200).json({ entries });
  } catch (error) {
    next(error);
  }
}

/** POST /api/donor/food-listings */
export async function createFoodListing(req, res, next) {
  try {
    const donorProfileId = requireDonorProfileId(req, res);
    if (!donorProfileId) return;

    const listing = await donorListingService.createDonation(
      donorProfileId,
      req.body,
    );

    res.status(201).json({ listing });
  } catch (error) {
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

    res.status(200).json({ listing });
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

    res.status(200).json({ listing });
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

    res.status(200).json({ listing });
  } catch (error) {
    next(error);
  }
}

/** PATCH /api/donor/food-listings/:id/ration */
export async function updateListingRation(req, res, next) {
  try {
    const donorProfileId = requireDonorProfileId(req, res);
    if (!donorProfileId) return;

    const listing = await donorListingService.updateDonation(
      req.params.id,
      donorProfileId,
      { ration: req.body?.ration },
    );

    res.status(200).json({ listing });
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

    res.status(201).json({ listing });
  } catch (error) {
    next(error);
  }
}
