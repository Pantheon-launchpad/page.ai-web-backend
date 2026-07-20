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

/**
 * Generic version of assertUserInScope for tenant-scoped CONTENT (Resource,
 * ExamConfig, StoreItem) rather than users. A school_admin may only
 * mutate content that belongs to their OWN school — never platform-wide
 * content (schoolId: null) and never another school's content. Unscoped
 * callers (super_admin/moderator) can mutate anything, including
 * platform-wide content.
 */
export const assertContentInScope = async (req, Model, id) => {
  if (!req.schoolScope) return; // unscoped — no restriction
  const doc = await Model.findById(id).select("schoolId");
  if (!doc) throw ApiError.notFound("Not found");
  if (!doc.schoolId || doc.schoolId.toString() !== req.schoolScope) {
    throw ApiError.forbidden("This item does not belong to your school");
  }
};

/**
 * A school_admin creating content is always forced onto their own
 * schoolId — the client can never set schoolId to another tenant, or to
 * null (platform-wide), by passing a different value in the request body.
 * Only unscoped callers (super_admin/moderator) may set schoolId freely
 * (including null, for platform-wide content).
 */
export const resolveCreateSchoolId = (req, requestedSchoolId) => {
  if (req.schoolScope) return req.schoolScope;
  return requestedSchoolId ?? null;
};
