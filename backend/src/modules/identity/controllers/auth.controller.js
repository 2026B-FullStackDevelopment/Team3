import * as authService from "../services/auth.service.js";
import {
  validateRegister,
  validateLogin,
} from "../validators/auth.validators.js";
import { clearCookieOptions,sessionCookieOptions } from "../helpers/cookies.helper.js";
import { env } from "../../../config/env.js";

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

/**
 * POST /api/auth/logout  (protected — requireAuth attaches req.user)
 * Revokes the current token's jti and clears the session cookie.
 */
export async function logout(req, res, next) {
  try {
    const { jti, userId, tokenExpiresAt } = req.user;
    await authService.logout({ jti, userId, expiresAt: tokenExpiresAt });
    res.clearCookie(env.cookie.name, clearCookieOptions());
    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
}
