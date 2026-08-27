import { userRole } from "../models/User.js";
import { ValidationError } from "../../../shared/errors/errors.js";
import { asString } from "../helpers/validators.helper.js";
import { validateStrength as validatePassword } from "../helpers/password.helper.js";
import {
  validateDonorProfile,
  validateEmail,
  validateRecipientProfile,
  validateRole,
} from "../helpers/auth.helper.js";

/**
 * Validates + normalizes a registration request body. Returns a clean input
 * object (email lowercased, role-specific profile fields separated) or throws
 * ValidationError. Field-level rules live in auth.helper.js; this function only
 * orchestrates them. Controllers call this before touching the service.
 */
export function validateRegister(body = {}) {
  const email = validateEmail(body.email);
  const password = validatePassword(body.password);
  const role = validateRole(body.role);

  const profile =
    role === userRole.Recipient
      ? validateRecipientProfile(body)
      : validateDonorProfile(body);

  return { email, password, role, profile };
}

/**
 * Validates + normalizes a login request body. Only checks presence/shape —
 * credential correctness (and the generic failure response) is the service's
 * job. No password-strength checks here; that gates registration, not login,
 * and no trimming of the password (spaces are significant).
 */
export function validateLogin(body = {}) {
  const email = asString(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }
  return { email, password };
}
