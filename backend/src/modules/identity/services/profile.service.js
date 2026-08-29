import * as userRepository from "../repositories/user.repository.js";
import * as revokedTokenRepository from "../repositories/revokedToken.repository.js";
import * as passwordHelper from "../helpers/password.helper.js";
import { toProfileDTO } from "../dtos/profile.dto.js";
import { profileRepositoryFor } from "../helpers/profile.helper.js";
import {
  avatarUrlFor,
  deleteAvatar,
} from "../../../shared/upload/services/storage.js";
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

/**
 * Sets the current user's avatar to a just-uploaded file and returns the updated
 * profile DTO. The file is already on disk (multer). Reads the old avatarUrl so
 * the replaced file can be cleaned up, persists the new URL, then best-effort
 * deletes the old file. If anything fails before the URL is persisted, the
 * newly-written file is removed so a failed upload never orphans a file.
 */
export async function updateAvatar(userId, role, file) {
  const avatarUrl = avatarUrlFor(file.filename);

  const user = await userRepository.findById(userId);
  if (!user) {
    await deleteAvatar(avatarUrl);
    throw new UnauthorizedError("Session is no longer valid");
  }

  const repo = profileRepositoryFor(role);
  const existing = await repo.findByUserId(userId);
  if (!existing) {
    await deleteAvatar(avatarUrl);
    throw new NotFoundError("Profile not found");
  }
  const oldAvatarUrl = existing.avatarUrl ?? null;

  let profile;
  try {
    profile = await repo.updateByUserId(userId, { avatarUrl });
  } catch (error) {
    await deleteAvatar(avatarUrl);
    throw error;
  }
  if (!profile) {
    await deleteAvatar(avatarUrl);
    throw new NotFoundError("Profile not found");
  }

  // Replaced file is now unreferenced — best-effort remove it.
  if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
    await deleteAvatar(oldAvatarUrl);
  }

  return toProfileDTO(user, profile);
}

/**
 * Clears the current user's avatar and returns the updated profile DTO.
 * Idempotent: with no avatar set it's a no-op that still returns the profile.
 * Persists `avatarUrl = null` first, then best-effort deletes the backing file
 * so a failed unlink can't leave a dangling DB reference.
 */
export async function removeAvatar(userId, role) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new UnauthorizedError("Session is no longer valid");
  }

  const repo = profileRepositoryFor(role);
  const existing = await repo.findByUserId(userId);
  if (!existing) {
    throw new NotFoundError("Profile not found");
  }

  const oldAvatarUrl = existing.avatarUrl ?? null;
  if (!oldAvatarUrl) {
    return toProfileDTO(user, existing); // nothing to remove
  }

  const profile = await repo.updateByUserId(userId, { avatarUrl: null });
  if (!profile) {
    throw new NotFoundError("Profile not found");
  }

  await deleteAvatar(oldAvatarUrl);

  return toProfileDTO(user, profile);
}
