import { AccountStatus } from "../models/User.js";
import { createProfile } from "../helpers/auth.helper.js";
import * as userRepository from "../repositories/user.repository.js";
import * as revokedTokenRepository from "../repositories/revokedToken.repository.js";
import * as tokenService from "../helpers/token.helper.js";
import bcrypt from "bcrypt";
import { env } from "../../../config/env.js";
import { toUserDTO } from "../dtos/user.dto.js";
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} from "../../../shared/errors/errors.js";

const DUPLICATE_KEY = 11000;

/**
 * Registers a new Donor or Recipient: creates the User, then the matching
 * role profile. Input is assumed already validated/normalized by the
 * validator. Returns a safe user DTO
 */
export async function register({ email, password, role, profile }) {
  if (await userRepository.existsByEmail(email)) {
    throw new ConflictError("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, env.auth.bcryptRounds);
  const user = await userRepository.create({ email, passwordHash, role });

  try {
    await createProfile(role, user._id, profile);
  } catch (error) {
    await userRepository.deleteById(user._id); // Delete user if the create user profile failed.
    if (error?.code === DUPLICATE_KEY) {
      throw new ConflictError("Profile details are already in use");
    }
    throw error;
  }

  return toUserDTO(user);
}

/**
 * Authenticates a login attempt and, on success, issues a session token.
 * Flow (in order): existing email -> lockout -> password -> deactivated.
 * The lockout is checked BEFORE the password so an account with too many
 * failed attempts can't keep guessing until the lock expires. A Deactivated
 * status is only revealed AFTER a correct password (BUSINESS_RULES §5.1).
 * Failures are counted atomically and lock at the configured threshold.
 * Returns { user (DTO), token, expiresAt, jti } for the controller to set the
 * cookie. Does NOT set the cookie itself (that's the HTTP layer's job).
 */
export async function login({ email, password }) {
  const user = await userRepository.findByEmailWithSecret(email);

  // 1. Account must exist.
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // 2. A live lock short-circuits before any password attempt is allowed.
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    throw new UnauthorizedError(
      "Account is temporarily locked due to too many failed attempts. Try again later.",
    );
  }

  // 3. Verify the password; a wrong one counts toward the lockout.
  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    await userRepository.registerFailedAttempt(user._id);
    throw new UnauthorizedError("Invalid email or password");
  }

  // 4. Only after a verified password is it safe to reveal deactivation.
  if (user.accountStatus === AccountStatus.Deactivated) {
    throw new ForbiddenError("This account has been deactivated");
  }

  await userRepository.resetLockout(user._id);
  const { token, jti, expiresAt } = tokenService.sign({
    userId: user._id,
    role: user.role,
  });

  return { user: toUserDTO(user), token, jti, expiresAt };
}

/**
 * Logs a user out by revoking the current token's jti. expiresAt mirrors the
 * token expiry so the revocation row self-expires via the TTL index. Idempotent:
 * revoking an already-revoked jti (duplicate key) is treated as success.
 */
export async function logout({ jti, userId, expiresAt }) {
  try {
    await revokedTokenRepository.add({ jti, userId, expiresAt });
  } catch (error) {
    if (error?.code !== DUPLICATE_KEY) {
      throw error;
    }
  }
}

