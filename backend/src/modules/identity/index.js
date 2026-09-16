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
import {
  toDonorLocationRefDTO,
  toDonorMunicipalityRefDTO,
  toDonorProfileRefDTO,
  toPremiumRecipientRefDTO,
  toRecipientProfileRefDTO,
  toUserContactDTO,
} from "./dtos/crossModuleRef.dto.js";

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

/** Returns the DonorProfile (ref DTO) linked to an authenticated User, or null. */
export async function loadDonorProfile(userId) {
  return toDonorProfileRefDTO(
    await donorProfileRepository.findByUserId(userId),
  );
}

/** Returns a DonorProfile (ref DTO) by profile id for profile-to-User resolution. */
export async function loadDonorProfileById(donorProfileId, options) {
  return toDonorProfileRefDTO(
    await donorProfileRepository.findById(donorProfileId, options),
  );
}

/** Returns a RecipientProfile (ref DTO) linked to an authenticated User, or null. */
export async function loadRecipientProfile(userId, options) {
  return toRecipientProfileRefDTO(
    await recipientProfileRepository.findByUserId(userId, options),
  );
}

/** Returns a RecipientProfile (ref DTO) by id so other modules can resolve its User. */
export async function loadRecipientProfileById(recipientProfileId, options) {
  return toRecipientProfileRefDTO(
    await recipientProfileRepository.findById(recipientProfileId, options),
  );
}

/** Batch-resolves RecipientProfile (ref DTOs) for cross-module notification fan-out. */
export async function loadRecipientProfilesByIds(recipientProfileIds, options) {
  const profiles = await recipientProfileRepository.findByIds(
    recipientProfileIds,
    options,
  );
  return profiles.map(toRecipientProfileRefDTO);
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
    city: profile.city ?? null,
  };
}

/** Donor city/location DTO for Notification matching. */
export async function getDonorMatchingLocation(donorProfileId, options) {
  return toDonorLocationRefDTO(
    await donorProfileRepository.findById(donorProfileId, options),
  );
}

/** Batch donor city/location DTOs for recipient listing proximity ordering. */
export async function getDonorProximityRefs(donorProfileIds, options) {
  const profiles = await donorProfileRepository.findByIds(
    donorProfileIds,
    options,
  );
  return profiles.map(toDonorLocationRefDTO);
}

/** Current Premium recipients from a set of preference-owner profile ids. */
export async function getActivePremiumRecipientRefs(
  recipientProfileIds,
  options,
) {
  const profiles = await recipientProfileRepository.findByIds(
    recipientProfileIds,
    options,
  );
  return profiles
    .filter((profile) => premiumHelper.isPremiumActive(profile))
    .map(toPremiumRecipientRefDTO);
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

/** Batch-fetches DonorProfiles (ref DTOs) by id, for the Admin module's food-listing views. */
export async function getDonorProfilesByIds(donorProfileIds, options) {
  const profiles = await accountService.getDonorProfilesByIds(
    donorProfileIds,
    options,
  );
  return profiles.map(toDonorProfileRefDTO);
}

/** Returns only the public municipality data Donation needs for recipient browse. */
export async function getDonorMunicipalitiesByIds(donorProfileIds, options) {
  const profiles = await accountService.getDonorMunicipalitiesByIds(
    donorProfileIds,
    options,
  );
  return profiles.map(toDonorMunicipalityRefDTO);
}

/** Resolves donors in an exact supported Vietnamese municipality. */
export function findDonorProfileIdsByMunicipality(municipality, options) {
  return accountService.findDonorProfileIdsByMunicipality(
    municipality,
    options,
  );
}

/** Finds DonorProfile ids whose companyName matches a search term (SRS 7.3.2). */
export function findDonorProfileIdsByName(namePattern) {
  return accountService.findDonorProfileIdsByName(namePattern);
}

/** Batch-fetches Users (contact DTOs) by id, for the Admin module's Audit Log admin-email join. */
export async function getUsersByIds(userIds, options) {
  const users = await accountService.getUsersByIds(userIds, options);
  return users.map(toUserContactDTO);
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
  paymentsFacade.registerHandler(
    "premium",
    subscriptionService.activatePremiumFromPayment,
  );
}
