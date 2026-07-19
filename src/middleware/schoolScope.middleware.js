import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../constants/roles.js";
import User from "../models/User.js";

/**
 * Multi-tenancy enforcement for the Admin API. Must run after requireAuth
 * + requireRole(...ADMIN_ROLES).
 *
 * - super_admin / moderator: platform-wide visibility — req.schoolScope is
 *   left undefined, so downstream list/get queries are unfiltered.
 * - school_admin: scoped to their own school ONLY. req.schoolScope is set
 *   to their schoolId; a school_admin with no schoolId is rejected outright
 *   rather than silently getting global (or zero) access.
 */
export const scopeToSchool = (req, res, next) => {
  if (req.user.role !== ROLES.SCHOOL_ADMIN) {
    req.schoolScope = undefined;
    return next();
  }
  if (!req.user.schoolId) {
    return next(ApiError.forbidden("Your account is not assigned to a school"));
  }
  req.schoolScope = req.user.schoolId.toString();
  next();
};

/**
 * For single-resource mutations (suspend/ban/edit/delete a specific user),
 * scopeToSchool alone isn't enough — it needs to check that specific
 * target actually belongs to the caller's school. Wraps the target lookup
 * so controllers don't each re-implement this check.
 */
export const assertUserInScope = async (req, targetUserId) => {
  if (!req.schoolScope) return; // unscoped (super_admin/moderator) — no restriction
  const target = await User.findById(targetUserId).select("schoolId");
  if (!target) throw ApiError.notFound("User not found");
  if (!target.schoolId || target.schoolId.toString() !== req.schoolScope) {
    throw ApiError.forbidden("This user is not in your school");
  }
};
