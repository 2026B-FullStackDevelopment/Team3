/**
 * Identity module public surface (Facade/Port).
 *
 * Other modules and the shared auth middleware import ONLY from here — never
 * from `services/…` / `repositories/…` internals. Exposes the minimum needed
 * to authenticate a request: verify a token and check whether it's revoked.
 */
import * as tokenHelper from "./helpers/token.helper.js";
import * as revokedTokenRepository from "./repositories/revokedToken.repository.js";
import * as accountService from "./services/account.service.js";

// Role vocabulary is part of Identity's public surface — other modules read it
// from here (the facade), never from the internal User model.
export { userRole } from "./models/User.js";

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

// --- Admin account management (SRS 7.1.1, 7.2.1) ---------------------------

/** Paginated list of Recipient/Donor accounts for the Admin account listing. */
export function listAccounts(filters) {
  return accountService.listAccounts(filters);
}

/** Fetches one account by id, DTO-shaped. */
export function getAccountById(userId) {
  return accountService.getAccountById(userId);
}

/** Deactivates a Recipient or Donor account; they can no longer log in until reactivated. */
export function deactivateAccount(userId) {
  return accountService.deactivateAccount(userId);
}

/** Reactivates a previously deactivated Recipient or Donor account. */
export function reactivateAccount(userId) {
  return accountService.reactivateAccount(userId);
}
