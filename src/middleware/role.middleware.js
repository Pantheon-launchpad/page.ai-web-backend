import { ApiError } from "../utils/ApiError.js";
import { ROLE_PERMISSIONS, ROLES } from "../constants/roles.js";

/**
 * requireRole("moderator", "school_admin") — allows any listed role, or super_admin always.
 * Must run after requireAuth.
 */
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === ROLES.SUPER_ADMIN || roles.includes(req.user.role)) {
      return next();
    }
    next(ApiError.forbidden("You do not have permission to perform this action"));
  };

/**
 * requirePermission("users:suspend") — checks the string-permission model from
 * TECHNICAL_DOCUMENTATION.md §17. super_admin implicitly has every permission.
 */
export const requirePermission =
  (...permissions) =>
  (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    const granted = ROLE_PERMISSIONS[req.user.role] || [];
    if (granted.includes("*") || permissions.every((p) => granted.includes(p))) {
      return next();
    }
    next(ApiError.forbidden("You do not have permission to perform this action"));
  };
