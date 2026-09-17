import { RevokedToken } from "../models/RevokedToken.js";

/**
 * Records a token's jti as revoked. expiresAt mirrors the token's own expiry
 * so the TTL index can auto-purge the row once the token would have expired
 * anyway. jti is uniquely indexed.
 */
export async function add(revocation) {
  return RevokedToken.create(revocation);
}

/**
 * True if this jti has been revoked. Indexed point lookup, run by the auth
 * middleware on every protected request.
 */
export async function existsByJti(jti) {
  const found = await RevokedToken.exists({ jti });
  return found !== null;
}
