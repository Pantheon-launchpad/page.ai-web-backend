import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { assertUserInScope, assertContentInScope, resolveCreateSchoolId } from "../../middleware/schoolScope.middleware.js";

import * as dashboardService from "../../services/admin/dashboard.service.js";
import * as usersService from "../../services/admin/users.service.js";
import * as contentService from "../../services/admin/content.service.js";
import * as examConfigsService from "../../services/admin/examConfigs.service.js";
import * as storeItemsService from "../../services/admin/storeItems.service.js";
import * as reportsService from "../../services/admin/reports.service.js";
import * as withdrawalsService from "../../services/admin/withdrawals.service.js";
import * as analyticsService from "../../services/admin/analytics.service.js";
import * as featureFlagsService from "../../services/admin/featureFlags.service.js";
import * as rolesService from "../../services/admin/roles.service.js";
import * as auditLogsService from "../../services/admin/auditLogs.service.js";
import * as systemHealthService from "../../services/admin/systemHealth.service.js";
import * as schoolService from "../../services/school.service.js";
import Resource from "../../models/Resource.js";
import ExamConfig from "../../models/ExamConfig.js";
import StoreItem from "../../models/StoreItem.js";

// --- Dashboard ---
export const getDashboard = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await dashboardService.getAdminDashboard() });
});

// --- Users ---
export const listUsers = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await usersService.listUsers({ ...req.query, schoolScope: req.schoolScope }) });
});
export const getUser = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await usersService.getUser(req.params.id, req.schoolScope) });
});
export const updateUser = asyncHandler(async (req, res) => {
  await assertUserInScope(req, req.params.id);
  sendSuccess(res, { data: await usersService.updateUser(req.params.id, req.body), message: "User updated" });
});
export const suspendUser = asyncHandler(async (req, res) => {
  await assertUserInScope(req, req.params.id);
  sendSuccess(res, { data: await usersService.setUserStatus(req.params.id, "suspended"), message: "User suspended" });
});
export const banUser = asyncHandler(async (req, res) => {
  await assertUserInScope(req, req.params.id);
  sendSuccess(res, { data: await usersService.setUserStatus(req.params.id, "banned"), message: "User banned" });
});
export const reinstateUser = asyncHandler(async (req, res) => {
  await assertUserInScope(req, req.params.id);
  sendSuccess(res, { data: await usersService.setUserStatus(req.params.id, "active"), message: "User reinstated" });
});
export const deleteUser = asyncHandler(async (req, res) => {
  await assertUserInScope(req, req.params.id);
  await usersService.deleteUser(req.params.id);
  sendSuccess(res, { data: null, message: "User deleted" });
});

// --- Content ---
export const listContent = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await contentService.listContent({ ...req.query, schoolScope: req.schoolScope }) });
});
export const createContent = asyncHandler(async (req, res) => {
  const schoolId = resolveCreateSchoolId(req, req.body.schoolId);
  const data = await contentService.createContent({ ...req.body, schoolId });
  sendSuccess(res, { data, status: 201, message: "Content created" });
});
export const updateContent = asyncHandler(async (req, res) => {
  await assertContentInScope(req, Resource, req.params.id);
  sendSuccess(res, { data: await contentService.updateContent(req.params.id, req.body), message: "Content updated" });
});
export const updateContentStatus = asyncHandler(async (req, res) => {
  await assertContentInScope(req, Resource, req.params.id);
  sendSuccess(res, { data: await contentService.updateContentStatus(req.params.id, req.body.status) });
});
export const deleteContent = asyncHandler(async (req, res) => {
  await assertContentInScope(req, Resource, req.params.id);
  await contentService.deleteContent(req.params.id);
  sendSuccess(res, { data: null, message: "Content deleted" });
});

// --- Exam configs (CBT papers/mock exams) ---
export const listExamConfigs = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await examConfigsService.listExamConfigs({ ...req.query, schoolScope: req.schoolScope }) });
});
export const createExamConfig = asyncHandler(async (req, res) => {
  const schoolId = resolveCreateSchoolId(req, req.body.schoolId);
  const data = await examConfigsService.createExamConfig({ ...req.body, schoolId });
  sendSuccess(res, { data, status: 201, message: "Exam config created" });
});
export const updateExamConfig = asyncHandler(async (req, res) => {
  await assertContentInScope(req, ExamConfig, req.params.id);
  sendSuccess(res, { data: await examConfigsService.updateExamConfig(req.params.id, req.body), message: "Exam config updated" });
});
export const deleteExamConfig = asyncHandler(async (req, res) => {
  await assertContentInScope(req, ExamConfig, req.params.id);
  await examConfigsService.deleteExamConfig(req.params.id);
  sendSuccess(res, { data: null, message: "Exam config deleted" });
});

// --- Store items ---
export const listStoreItems = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await storeItemsService.listStoreItemsAdmin({ ...req.query, schoolScope: req.schoolScope }) });
});
export const createStoreItem = asyncHandler(async (req, res) => {
  const schoolId = resolveCreateSchoolId(req, req.body.schoolId);
  const data = await storeItemsService.createStoreItem({ ...req.body, schoolId });
  sendSuccess(res, { data, status: 201, message: "Store item created" });
});
export const updateStoreItem = asyncHandler(async (req, res) => {
  await assertContentInScope(req, StoreItem, req.params.id);
  sendSuccess(res, { data: await storeItemsService.updateStoreItem(req.params.id, req.body), message: "Store item updated" });
});
export const deleteStoreItem = asyncHandler(async (req, res) => {
  await assertContentInScope(req, StoreItem, req.params.id);
  await storeItemsService.deleteStoreItem(req.params.id);
  sendSuccess(res, { data: null, message: "Store item deleted" });
});

// --- Reports ---
export const listReports = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await reportsService.listReports({ ...req.query, schoolScope: req.schoolScope }) });
});
export const updateReport = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await reportsService.updateReport(req.params.id, req.body) });
});

// --- Withdrawals ---
export const listWithdrawals = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await withdrawalsService.listWithdrawals(req.query) });
});
export const approveWithdrawal = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await withdrawalsService.approveWithdrawal(req.params.id) });
});
export const rejectWithdrawal = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await withdrawalsService.rejectWithdrawal(req.params.id) });
});

// --- Analytics ---
export const getAnalytics = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await analyticsService.getPlatformAnalytics() });
});

// --- Feature flags ---
export const listFlags = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await featureFlagsService.listFlags() });
});
export const upsertFlag = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await featureFlagsService.upsertFlag(req.body) });
});
export const deleteFlag = asyncHandler(async (req, res) => {
  await featureFlagsService.deleteFlag(req.params.key);
  sendSuccess(res, { data: null, message: "Feature flag deleted" });
});

// --- Roles ---
export const listRoles = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await rolesService.listRoles() });
});
export const updateRole = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await rolesService.updateRolePermissions(req.params.role, req.body.permissions) });
});

// --- Audit logs ---
export const listAuditLogs = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await auditLogsService.listAuditLogs(req.query) });
});

// --- System health ---
export const getSystemHealth = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await systemHealthService.getSystemHealth() });
});

// --- Schools (multi-tenancy) ---
// Global (super_admin/moderator) management of any school:
export const listSchools = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await schoolService.listSchools(req.query) });
});
export const createSchool = asyncHandler(async (req, res) => {
  const data = await schoolService.createSchool(req.body);
  sendSuccess(res, { data, status: 201, message: "School created" });
});
export const getSchoolById = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await schoolService.getSchool(req.params.id) });
});
export const updateSchoolById = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await schoolService.updateSchool(req.params.id, req.body), message: "School updated" });
});

// Self-service (school_admin) — always scoped to req.schoolScope, never a
// client-supplied id, so a school_admin can never read/edit another school
// by guessing its id.
export const getMySchool = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await schoolService.getSchool(req.schoolScope) });
});
export const updateMySchool = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await schoolService.updateSchool(req.schoolScope, req.body), message: "School updated" });
});
export const listMySchoolStudents = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await schoolService.listSchoolStudents(req.schoolScope, req.query) });
});
