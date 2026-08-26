import * as profileService from "../services/profile.service.js";
import { userRole } from "../models/User.js";
import {
  validateRecipientProfileUpdate,
  validateDonorProfileUpdate,
} from "../validators/profile.validators.js";

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

/**
 * PATCH /api/profile  (protected — requireAuth + requireRole member)
 * Validates the role-appropriate partial body, applies it, and returns the
 * updated profile DTO. Role drives which editable fields are accepted.
 */
export async function updateProfile(req, res, next) {
  try {
    const patch =
      req.user.role === userRole.Recipient
        ? validateRecipientProfileUpdate(req.body)
        : validateDonorProfileUpdate(req.body);
    const profile = await profileService.updateProfile(req.user.userId, patch);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}
