import * as identity from "../modules/identity/index.js";
import { UnauthorizedError } from "../shared/errors/errors.js";

/**
 * Resolves the authenticated Donor's profile server-side. Mount after
 * requireAuth and the Donor role guard so profile ownership never comes from
 * a client-controlled header or request body.
 */
export async function loadDonorProfile(req, _res, next) {
  try {
    const donorProfile = await identity.loadDonorProfile(req.user.userId);

    if (!donorProfile) {
      throw new UnauthorizedError("An authenticated donor profile is required");
    }

    req.user.donorProfileId = String(donorProfile._id);
    next();
  } catch (error) {
    next(error);
  }
}
