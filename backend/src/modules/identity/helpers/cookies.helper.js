import { env } from "../../../config/env.js";
/**
 * Cookie options for the session token. httpOnly keeps it out of JS (XSS),
 * SameSite=Lax is our CSRF defense (BUSINESS_RULES §5.3), Secure is on only
 * in production so local HTTP dev still works. `expires` matches the JWT exp.
 */
export function sessionCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    sameSite: "lax",
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
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
  };
}
