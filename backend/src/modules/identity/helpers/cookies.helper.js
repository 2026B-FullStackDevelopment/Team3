import { env } from "../../../config/env.js";
/**
 * Cookie options for the session token. httpOnly keeps it out of JS (XSS).
 * In production the frontend and backend are on different Render domains, so the
 * cookie must be SameSite=None (sent on cross-site XHR/fetch) + Secure. Locally
 * (same-origin via the Vite proxy, plain HTTP) we keep SameSite=Lax as the CSRF
 * defense (BUSINESS_RULES §5.3) with Secure off. `expires` matches the JWT exp.
 */
export function sessionCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    sameSite: env.isProduction ? "none" : "lax",
    secure: env.isProduction,
    expires: expiresAt,
    path: "/",
  };
}

/**
 * Options used to clear the session cookie. Must match the flags the cookie
 * was set with (name/path/sameSite/secure) for the browser to actually drop it.
 */
export function clearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: env.isProduction ? "none" : "lax",
    secure: env.isProduction,
    path: "/",
  };
}
