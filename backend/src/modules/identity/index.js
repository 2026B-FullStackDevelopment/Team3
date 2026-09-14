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
import * as premiumHelper from "./helpers/premium.helper.js";
import * as subscriptionService from "./services/subscription.service.js";
import * as paymentsFacade from "../payments/index.js";

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

/** Returns a DonorProfile by profile id for profile-to-User resolution. */
export function loadDonorProfileById(donorProfileId, options) {
  return donorProfileRepository.findById(donorProfileId, options);
}

/** Returns a RecipientProfile linked to an authenticated User, or null. */
export function loadRecipientProfile(userId, options) {
  return recipientProfileRepository.findByUserId(userId, options);
}

/** Returns a RecipientProfile by id so other modules can resolve its User. */
export function loadRecipientProfileById(recipientProfileId, options) {
  return recipientProfileRepository.findById(recipientProfileId, options);
}

/** Batch-resolves RecipientProfile ids for cross-module notification fan-out. */
export function loadRecipientProfilesByIds(recipientProfileIds, options) {
  return recipientProfileRepository.findByIds(recipientProfileIds, options);
}

/**
 * Resolves an authenticated recipient's context for other modules: their
 * RecipientProfile id and current (lazily-computed) premium status. Returns
 * null when the user has no recipient profile. Keeps recipient-id resolution
 * and premium logic inside Identity (facade — ARCHITECTURE §4).
 */
export async function getRecipientContext(userId) {
  const profile = await recipientProfileRepository.findByUserId(userId);
  if (!profile) return null;
  return {
    recipientProfileId: profile._id,
    isPremium: premiumHelper.isPremiumActive(profile),
  };
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

/** Batch-fetches Users by id, for the Admin module's Audit Log admin-email join. */
export function getUsersByIds(userIds, options) {
  return accountService.getUsersByIds(userIds, options);
}

/** Finds Admin user ids whose email matches a search term (Audit Log search). */
export function findAdminIdsByEmailLike(emailPattern) {
  return accountService.findAdminIdsByEmailLike(emailPattern);
}

/**
 * Wires Identity's fulfilment handlers into the payments module. Called once at
 * app startup so a completed "premium" Checkout Session activates premium.
 */
export function registerPaymentHandlers() {
  paymentsFacade.registerHandler("premium", subscriptionService.activatePremiumFromPayment);
}
