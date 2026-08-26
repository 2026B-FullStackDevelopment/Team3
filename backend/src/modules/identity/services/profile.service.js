import { userRole } from "../models/User.js";
import * as userRepository from "../repositories/user.repository.js";
import * as recipientProfileRepository from "../repositories/recipientProfile.repository.js";
import * as donorProfileRepository from "../repositories/donorProfile.repository.js";
import { toProfileDTO } from "../dtos/profile.dto.js";
import {
  NotFoundError,
  UnauthorizedError,
} from "../../../shared/errors/errors.js";

/** Picks the role's profile repository. Role is trusted (from the signed token
 * and re-read off the User doc), and the route already restricts to members. */
function profileRepositoryFor(role) {
  return role === userRole.Recipient
    ? recipientProfileRepository
    : donorProfileRepository;
}

/**
 * Loads the current user's full profile: the shared User fields plus the
 * role-specific profile row, composed into one DTO. A valid token whose user no
 * longer exists is treated as an invalid session (401); a member whose role
 * profile row is missing is a data defect (404, defensive).
 */
export async function getProfile(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new UnauthorizedError("Session is no longer valid");
  }

  const profile = await profileRepositoryFor(user.role).findByUserId(userId);
  if (!profile) {
    throw new NotFoundError("Profile not found");
  }

  return toProfileDTO(user, profile);
}
