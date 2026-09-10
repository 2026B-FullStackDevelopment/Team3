import { Donation } from "../modules/donation/models/donation.model.js";
import { DonorProfile } from "../modules/identity/models/DonorProfile.js";

/**
 * Temporary development-only identity for the Donation frontend.
 *
 * TODO(auth): Remove this middleware and restore requireAuth, requireRole, and
 * loadDonorProfile in the Donation routers when the Login feature is ready.
 * The donor id is resolved only on the server; request headers/query/body are
 * deliberately ignored so a browser cannot impersonate another donor.
 */
export async function loadDonationDevelopmentDonor(req, res, next) {
  if (process.env.NODE_ENV === "production") {
    return res.status(503).json({
      error: "AUTH_NOT_CONFIGURED",
      message: "Donation authentication must be enabled in production",
    });
  }

  try {
    const configuredId = process.env.DONATION_DEMO_DONOR_PROFILE_ID?.trim();
    let donorProfile = configuredId
      ? await DonorProfile.findById(configuredId)
      : null;

    if (!donorProfile) {
      const latestListing = await Donation.findOne()
        .sort({ createdAt: -1 })
        .select("donorProfileId")
        .lean();

      donorProfile = latestListing?.donorProfileId
        ? await DonorProfile.findById(latestListing.donorProfileId)
        : await DonorProfile.findOne();
    }

    if (!donorProfile) {
      return res.status(503).json({
        error: "DONATION_DEMO_DONOR_MISSING",
        message:
          "No donor profile is available. Seed the database or set DONATION_DEMO_DONOR_PROFILE_ID.",
      });
    }

    req.user = {
      ...(req.user ?? {}),
      userId: String(donorProfile.userId),
      donorProfileId: String(donorProfile._id),
      role: "Donor",
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
