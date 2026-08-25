import * as authService from "../services/auth.service.js";
import {
  validateRegister,
  validateLogin,
} from "../validators/auth.validators.js";
import { env } from "../../../config/env.js";

/**
 * Cookie options for the session token. httpOnly keeps it out of JS (XSS),
 * SameSite=Lax is our CSRF defense (BUSINESS_RULES §5.3), Secure is on only
 * in production so local HTTP dev still works. `expires` matches the JWT exp.
 */
function sessionCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    expires: expiresAt,
    path: "/",
  };
}

/**
 * POST /api/auth/register
 * Validates the request shape, creates the account, returns 201 + user DTO.
 * No session is issued here — the client calls /login afterwards.
 */
export async function register(req, res, next) {
  try {
    const input = validateRegister(req.body);
    const user = await authService.register(input);
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Verifies credentials, sets the httpOnly session cookie, returns the user DTO.
 * The raw token lives only in the cookie — never in the JSON body.
 */
export async function login(req, res, next) {
  try {
    const input = validateLogin(req.body);
    const { user, token, expiresAt } = await authService.login(input);
    res.cookie(env.cookie.name, token, sessionCookieOptions(expiresAt));
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}
