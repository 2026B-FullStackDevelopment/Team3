import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../../config/env.js";

/**
 * Signs a short-lived access token (JWS) for an authenticated user.
 * Payload is exactly { userId, role, jti } with a 1-hour expiry (from config).
 * The jti is a fresh uuid so the token can be individually revoked on logout.
 * Returns the token plus its jti and absolute expiry (for the cookie maxAge
 * and the revocation record).
 */
export function sign({ userId, role }) {
  const jti = uuidv4();
  const token = jwt.sign({ userId, role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
    jwtid: jti,
  });

  // Read the actual exp the signer stamped, rather than recomputing it.
  const { exp } = jwt.decode(token);
  return { token, jti, expiresAt: new Date(exp * 1000) };
}
