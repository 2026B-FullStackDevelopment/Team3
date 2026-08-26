import * as userRepository from "../repositories/user.repository.js";
import { toProfileDTO } from "../dtos/profile.dto.js";
import { profileRepositoryFor } from "../helpers/profile.helper.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../../shared/errors/errors.js";

const DUPLICATE_KEY = 11000;



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

/**
 * Applies a validated partial patch to the current user's role profile and
 * returns the updated composite DTO. The patch is already role-appropriate
 * (validated in the controller); the role's repo is chosen off the DB User doc.
 * A duplicate userName surfaces as E11000 and is mapped to a 409.
 */
export async function updateProfile(userId, patch) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new UnauthorizedError("Session is no longer valid");
  }

  let profile;
  try {
    profile = await profileRepositoryFor(user.role).updateByUserId(userId, patch);
  } catch (error) {
    if (error?.code === DUPLICATE_KEY) {
      throw new ConflictError("userName is already in use");
    }
    throw error;
  }

  if (!profile) {
    throw new NotFoundError("Profile not found");
  }

  return toProfileDTO(user, profile);
}
