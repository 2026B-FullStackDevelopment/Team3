import * as profileService from "../services/profile.service.js";

/**
 * GET /api/profile  (protected — requireAuth + requireRole member)
 * Returns the current user's composed profile DTO (User + role profile).
 */
export async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getProfile(req.user.userId);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}
