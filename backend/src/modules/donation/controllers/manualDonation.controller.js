import * as manualDonationService from "../services/manualDonation.service.js";

function getDonorProfileId(req) {
  return req.user?.donorProfileId;
}

/** POST /api/donor/food-listings/:id/manual-donations */
export async function createManualDonation(req, res, next) {
  try {
    const donorProfileId = getDonorProfileId(req);
    if (!donorProfileId) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
        message: "An authenticated donor profile is required",
      });
    }

    const result = await manualDonationService.createManualDonation(
      String(donorProfileId),
      req.params.id,
      req.body,
    );
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}
