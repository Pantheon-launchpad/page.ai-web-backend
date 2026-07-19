import { z } from "zod";

export const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["student", "teacher", "moderator", "school_admin", "super_admin"]).optional(),
  school: z.string().optional(),
});

export const updateContentStatusSchema = z.object({
  status: z.enum(["published", "draft", "flagged", "removed"]),
});

export const updateReportSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved", "dismissed"]).optional(),
  notes: z.string().optional(),
});

export const upsertFlagSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  enabled: z.boolean(),
  rolloutPercent: z.number().min(0).max(100).default(0),
});

export const updateRoleSchema = z.object({
  permissions: z.array(z.string()).min(0),
});

export const createSchoolSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  contactEmail: z.string().email().optional(),
  ownerUserId: z.string().optional(), // if provided, that user becomes this school's school_admin
});

export const updateSchoolSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().optional(),
  contactEmail: z.string().email().optional(),
  plan: z.enum(["free", "school_basic", "school_premium"]).optional(),
  active: z.boolean().optional(),
});
