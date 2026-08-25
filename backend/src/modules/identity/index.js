/**
 * Identity module public surface (Facade/Port).
 *
 * Other modules and the shared auth middleware import ONLY from here — never
 * from `services/…` / `repositories/…` internals. Exposes the minimum needed
 * to authenticate a request: verify a token and check whether it's revoked.
 */
import * as tokenHelper from "./helpers/token.helper.js";
import * as revokedTokenRepository from "./repositories/revokedToken.repository.js";

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
