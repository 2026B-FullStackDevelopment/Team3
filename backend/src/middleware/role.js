import { ForbiddenError, UnauthorizedError } from "../shared/errors/errors.js";

/**
 * Role guard — mount AFTER requireAuth on routes limited to specific roles
 * (RBAC, BUSINESS_RULES §3). Returns a middleware that allows the request only
 * if req.user.role is one of allowedRoles; otherwise 403. If req.user is
 * missing (guard used without requireAuth), it fails closed with 401.
 *
 *   router.get("/admin/x", requireAuth, requireRole("Admin"), handler)
 */
export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("You do not have access to this resource"));
    }
    next();
  };
}
