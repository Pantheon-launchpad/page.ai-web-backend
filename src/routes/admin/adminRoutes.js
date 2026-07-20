import express from "express";
import * as adminController from "../../controllers/admin/adminController.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole, requirePermission } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { auditLog } from "../../middleware/audit.middleware.js";
import { scopeToSchool } from "../../middleware/schoolScope.middleware.js";
import { ADMIN_ROLES } from "../../constants/roles.js";
import {
  listQuerySchema,
  updateUserSchema,
  updateContentStatusSchema,
  updateReportSchema,
  upsertFlagSchema,
  updateRoleSchema,
  createSchoolSchema,
  updateSchoolSchema,
  createContentSchema,
  updateContentSchema,
  createExamConfigSchema,
  updateExamConfigSchema,
  createStoreItemSchema,
  updateStoreItemSchema,
} from "../../validators/admin.validators.js";

const router = express.Router();

// Every /admin/* route requires authentication AND one of the admin roles,
// then resolves req.schoolScope: undefined for super_admin/moderator
// (platform-wide), or the caller's own schoolId for school_admin (see
// middleware/schoolScope.middleware.js — this is the multi-tenancy boundary).
router.use(requireAuth, requireRole(...ADMIN_ROLES), scopeToSchool);

router.get("/dashboard", adminController.getDashboard);

router.get("/users", validate({ query: listQuerySchema }), adminController.listUsers);
router.get("/users/:id", adminController.getUser);
router.patch(
  "/users/:id",
  requirePermission("users:edit"),
  validate({ body: updateUserSchema }),
  auditLog("update_user", (req) => req.params.id),
  adminController.updateUser,
);
router.post(
  "/users/:id/suspend",
  requirePermission("users:suspend"),
  auditLog("suspend_user", (req) => req.params.id),
  adminController.suspendUser,
);
router.post(
  "/users/:id/ban",
  requirePermission("users:ban"),
  auditLog("ban_user", (req) => req.params.id),
  adminController.banUser,
);
router.post(
  "/users/:id/reinstate",
  requirePermission("users:ban"),
  auditLog("reinstate_user", (req) => req.params.id),
  adminController.reinstateUser,
);
router.delete(
  "/users/:id",
  requireRole("super_admin"),
  auditLog("delete_user", (req) => req.params.id),
  adminController.deleteUser,
);

router.get("/content", validate({ query: listQuerySchema }), adminController.listContent);
router.post(
  "/content",
  requirePermission("content:edit"),
  validate({ body: createContentSchema }),
  auditLog("create_content"),
  adminController.createContent,
);
router.patch(
  "/content/:id",
  requirePermission("content:edit"),
  validate({ body: updateContentSchema }),
  auditLog("update_content", (req) => req.params.id),
  adminController.updateContent,
);
router.patch(
  "/content/:id/status",
  requirePermission("content:edit"),
  validate({ body: updateContentStatusSchema }),
  auditLog("update_content_status", (req) => req.params.id),
  adminController.updateContentStatus,
);
router.delete(
  "/content/:id",
  requirePermission("content:edit"),
  auditLog("delete_content", (req) => req.params.id),
  adminController.deleteContent,
);

// --- Exam configs (CBT papers/mock exams) ---
router.get("/exams", validate({ query: listQuerySchema }), adminController.listExamConfigs);
router.post(
  "/exams",
  requirePermission("content:edit"),
  validate({ body: createExamConfigSchema }),
  auditLog("create_exam_config"),
  adminController.createExamConfig,
);
router.patch(
  "/exams/:id",
  requirePermission("content:edit"),
  validate({ body: updateExamConfigSchema }),
  auditLog("update_exam_config", (req) => req.params.id),
  adminController.updateExamConfig,
);
router.delete(
  "/exams/:id",
  requirePermission("content:edit"),
  auditLog("delete_exam_config", (req) => req.params.id),
  adminController.deleteExamConfig,
);

// --- Store items ---
router.get("/store-items", validate({ query: listQuerySchema }), adminController.listStoreItems);
router.post(
  "/store-items",
  requirePermission("content:edit"),
  validate({ body: createStoreItemSchema }),
  auditLog("create_store_item"),
  adminController.createStoreItem,
);
router.patch(
  "/store-items/:id",
  requirePermission("content:edit"),
  validate({ body: updateStoreItemSchema }),
  auditLog("update_store_item", (req) => req.params.id),
  adminController.updateStoreItem,
);
router.delete(
  "/store-items/:id",
  requirePermission("content:edit"),
  auditLog("delete_store_item", (req) => req.params.id),
  adminController.deleteStoreItem,
);

router.get("/reports", requirePermission("reports:view"), validate({ query: listQuerySchema }), adminController.listReports);
router.patch(
  "/reports/:id",
  requirePermission("reports:update"),
  validate({ body: updateReportSchema }),
  auditLog("update_report", (req) => req.params.id),
  adminController.updateReport,
);

router.get(
  "/withdrawals",
  requirePermission("withdrawals:view"),
  validate({ query: listQuerySchema }),
  adminController.listWithdrawals,
);
router.post(
  "/withdrawals/:id/approve",
  requirePermission("withdrawals:approve"),
  auditLog("approve_withdrawal", (req) => req.params.id),
  adminController.approveWithdrawal,
);
router.post(
  "/withdrawals/:id/reject",
  requirePermission("withdrawals:reject"),
  auditLog("reject_withdrawal", (req) => req.params.id),
  adminController.rejectWithdrawal,
);

router.get("/analytics", adminController.getAnalytics);

router.get("/feature-flags", requireRole("super_admin"), adminController.listFlags);
router.put(
  "/feature-flags",
  requireRole("super_admin"),
  validate({ body: upsertFlagSchema }),
  auditLog("upsert_feature_flag", (req) => req.body.key),
  adminController.upsertFlag,
);
router.delete(
  "/feature-flags/:key",
  requireRole("super_admin"),
  auditLog("delete_feature_flag", (req) => req.params.key),
  adminController.deleteFlag,
);

router.get("/roles", requireRole("super_admin"), adminController.listRoles);
router.put(
  "/roles/:role",
  requireRole("super_admin"),
  validate({ body: updateRoleSchema }),
  auditLog("update_role_permissions", (req) => req.params.role),
  adminController.updateRole,
);

router.get("/audit-logs", requireRole("super_admin"), validate({ query: listQuerySchema }), adminController.listAuditLogs);

router.get("/system-health", adminController.getSystemHealth);

// --- Schools (multi-tenancy) ---
// Global management — super_admin only for mutations, moderator can view.
router.get("/schools", requireRole("moderator", "super_admin"), validate({ query: listQuerySchema }), adminController.listSchools);
router.post(
  "/schools",
  requireRole("super_admin"),
  validate({ body: createSchoolSchema }),
  auditLog("create_school"),
  adminController.createSchool,
);
router.get("/schools/:id", requireRole("moderator", "super_admin"), adminController.getSchoolById);
router.patch(
  "/schools/:id",
  requireRole("super_admin"),
  validate({ body: updateSchoolSchema }),
  auditLog("update_school", (req) => req.params.id),
  adminController.updateSchoolById,
);

// Self-service — a school_admin manages only their own school (req.schoolScope).
router.get("/schools/me/profile", requireRole("school_admin"), adminController.getMySchool);
router.patch(
  "/schools/me/profile",
  requireRole("school_admin"),
  validate({ body: updateSchoolSchema }),
  auditLog("update_own_school"),
  adminController.updateMySchool,
);
router.get(
  "/schools/me/students",
  requireRole("school_admin"),
  validate({ query: listQuerySchema }),
  adminController.listMySchoolStudents,
);

export default router;
