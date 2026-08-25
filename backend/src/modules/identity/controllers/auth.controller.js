import * as authService from "../services/auth.service.js";
import { validateRegister } from "../validators/auth.validators.js";

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
