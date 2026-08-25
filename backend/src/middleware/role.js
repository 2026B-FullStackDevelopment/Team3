import { ForbiddenError, UnauthorizedError } from "../shared/errors/errors.js";

/**
 * Role guard per A.2.3 -- rejects a request before it reaches a controller
 * if the caller's role isn't in the allowed list. Takes the roles as args
 * (`requireRole("Admin")`) rather than hardcoding "Admin" so the same guard
 * can protect any role-restricted route, not just Admin ones.
 *
 * TODO: req.user is not populated yet -- middleware/auth.js is still an
 * empty stub. Until that's implemented, every request hits the 401 branch
 * below, so routes using this guard are not actually reachable end-to-end.
 */
export function requireRole(...allowedRoles) {
  return function roleGuard(req, _res, next) {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Requires role: ${allowedRoles.join(" or ")}`));
    }
    next();
  };
}
