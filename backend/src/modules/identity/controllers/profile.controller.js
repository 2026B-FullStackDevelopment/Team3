import * as profileService from "../services/profile.service.js";
import { userRole } from "../models/User.js";
import {
  validateRecipientProfileUpdate,
  validateDonorProfileUpdate,
  validateChangePassword,
} from "../validators/profile.validators.js";
import { clearCookieOptions } from "../helpers/cookies.helper.js";
import { env } from "../../../config/env.js";
import { ValidationError } from "../../../shared/errors/errors.js";

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

/**
 * PATCH /api/profile/password  (protected — requireAuth + requireRole member)
 * Verifies the current password, sets the new one, and logs out the current
 * device: the current token is revoked in the service and the cookie is cleared
 * here, so the user must log in again with the new password.
 */
export async function changePassword(req, res, next) {
  try {
    const input = validateChangePassword(req.body);
    const { userId, jti, tokenExpiresAt } = req.user;
    await profileService.changePassword(userId, jti, tokenExpiresAt, input);
    res.clearCookie(env.cookie.name, clearCookieOptions());
    res.status(200).json({ message: "Password changed. Please log in again." });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/profile/avatar  (protected — requireAuth + requireRole member)
 * The avatarUpload middleware has already parsed + stored the file. Reject a
 * request with no valid image, else set the avatar and return the updated DTO.
 */
export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      throw new ValidationError("An avatar image file is required");
    }
    const profile = await profileService.updateAvatar(
      req.user.userId,
      req.user.role,
      req.file,
    );
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/profile/avatar  (protected — requireAuth + requireRole member)
 * Clears the current user's avatar and returns the updated profile DTO.
 * Idempotent: succeeds even when no avatar is set.
 */
export async function removeAvatar(req, res, next) {
  try {
    const profile = await profileService.removeAvatar(
      req.user.userId,
      req.user.role,
    );
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}
