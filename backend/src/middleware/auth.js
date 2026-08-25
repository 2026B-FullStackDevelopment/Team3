import * as identity from "../modules/identity/index.js";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../shared/errors/errors.js";

/**
 * Auth middleware — runs before any protected route.
 * Order per BUSINESS_RULES §4: signature + expiry, then revocation. On success
 * attaches req.user = { userId, role, jti, tokenExpiresAt }. Any failure yields
 * a generic 401 (never say *why* the token is bad). Talks to Identity only
 * through its facade, never its internals.
 */
export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.[env.cookie.name];
  
    if (!token) {
      throw new UnauthorizedError("Authentication required");
    }

    const payload = identity.verifyAccessToken(token);

    if (await identity.isRevoked(payload.jti)) {
      throw new UnauthorizedError("Session is no longer valid");
    }

    req.user = {
      userId: payload.userId,
      role: payload.role,
      jti: payload.jti,
      tokenExpiresAt: new Date(payload.exp * 1000),
    };
    next();
  } catch (error) {
    // jwt verify throws its own error types; normalize everything to 401.
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    next(new UnauthorizedError("Invalid or expired session"));
  }
}
