import * as userRepository from "../repositories/user.repository.js";
import * as revokedTokenRepository from "../repositories/revokedToken.repository.js";
import * as passwordHelper from "../helpers/password.helper.js";
import { toProfileDTO } from "../dtos/profile.dto.js";
import { profileRepositoryFor } from "../helpers/profile.helper.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
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

/**
 * Changes the current user's password and logs out the current device. Verifies
 * the supplied current password against the stored hash, rejects reusing the
 * same password, then persists the new hash and revokes the current token's jti
 * so the just-cleared cookie can't be replayed. Other devices ride out the
 * token's remaining lifetime. The controller clears the cookie.
 */
export async function changePassword(
  userId,
  jti,
  tokenExpiresAt,
  { currentPassword, newPassword },
) {
  const user = await userRepository.findByIdWithSecret(userId);
  if (!user) {
    throw new UnauthorizedError("Session is no longer valid");
  }

  const currentValid = await passwordHelper.verify(
    currentPassword,
    user.passwordHash,
  );
  if (!currentValid) {
    throw new UnauthorizedError("Current password is incorrect");
  }

  if (newPassword === currentPassword) {
    throw new ValidationError(
      "New password must be different from the current one",
    );
  }

  const passwordHash = await passwordHelper.hash(newPassword);
  await userRepository.updatePasswordHash(userId, passwordHash);

  // Revoke the current token so the cleared cookie can't be replayed. Idempotent:
  // an already-revoked jti (duplicate key) is treated as success.
  try {
    await revokedTokenRepository.add({ jti, userId, expiresAt: tokenExpiresAt });
  } catch (error) {
    if (error?.code !== DUPLICATE_KEY) {
      throw error;
    }
  }
}
