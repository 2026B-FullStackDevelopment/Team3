/**
 * Identity module public surface (Facade/Port).
 *
 * Other modules and the shared auth middleware import ONLY from here — never
 * from `services/…` / `repositories/…` internals. Exposes the minimum needed
 * to authenticate a request: verify a token and check whether it's revoked.
 */
import * as tokenHelper from "./helpers/token.helper.js";
import * as revokedTokenRepository from "./repositories/revokedToken.repository.js";
import * as donorProfileRepository from "./repositories/donorProfile.repository.js";
import * as recipientProfileRepository from "./repositories/recipientProfile.repository.js";
import * as accountService from "./services/account.service.js";
import * as authService from "./services/auth.service.js";

// Role + account-status vocabulary is part of Identity's public surface — other
// modules and the auth middleware read it from here (the facade), never from the
// internal User model.
export { userRole, AccountStatus } from "./models/User.js";

/**
 * Verifies signature + expiry, returning the decoded payload
 * ({ userId, role, jti, iat, exp }). Throws on invalid/expired tokens.
 */
export function verifyAccessToken(token) {
  return tokenHelper.verify(token);
}

/** True if the token with this jti has been revoked (e.g. via logout). */
export function isRevoked(jti) {
  return revokedTokenRepository.existsByJti(jti);
}

/**
 * Current auth state for a userId: `{ userId, role, accountStatus }`, or `null`
 * if the user no longer exists. The auth middleware calls this each request so a
 * deactivation (or deletion) takes effect immediately rather than lingering for
 * the token's remaining lifetime.
 */
export function loadAuthUser(userId) {
  return authService.getAuthUser(userId);
}

/** Returns the DonorProfile linked to an authenticated User, or null. */
export function loadDonorProfile(userId) {
  return donorProfileRepository.findByUserId(userId);
}

/** Returns a RecipientProfile by id so other modules can resolve its User. */
export function loadRecipientProfileById(recipientProfileId, options) {
  return recipientProfileRepository.findById(recipientProfileId, options);
}

// --- Admin account management (SRS 7.1.1, 7.2.1) ---------------------------

/** Paginated list of Recipient/Donor accounts for the Admin account listing. */
export function listAccounts(filters) {
  return accountService.listAccounts(filters);
}

/**
 * Fetches one account by id, DTO-shaped. `options.session` lets a caller
 * (e.g. the Admin module) fold this read into its own Mongo transaction.
 */
export function getAccountById(userId, options) {
  return accountService.getAccountById(userId, options);
}

/** Deactivates a Recipient or Donor account; they can no longer log in until reactivated. */
export function deactivateAccount(userId, options) {
  return accountService.deactivateAccount(userId, options);
}

/** Reactivates a previously deactivated Recipient or Donor account. */
export function reactivateAccount(userId, options) {
  return accountService.reactivateAccount(userId, options);
}

/** Batch-fetches DonorProfiles by id, for the Admin module's food-listing views. */
export function getDonorProfilesByIds(donorProfileIds, options) {
  return accountService.getDonorProfilesByIds(donorProfileIds, options);
}

/** Finds DonorProfile ids whose companyName matches a search term (SRS 7.3.2). */
export function findDonorProfileIdsByName(namePattern) {
  return accountService.findDonorProfileIdsByName(namePattern);
}
