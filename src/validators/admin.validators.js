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

export const createContentSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["video", "pdf", "article", "audio", "past_question"]),
  subjectId: z.string().optional(),
  url: z.string().optional(),
  thumbnail: z.string().optional(),
  durationMinutes: z.number().optional(),
  description: z.string().optional(),
  schoolId: z.string().nullable().optional(), // ignored for school_admin — see resolveCreateSchoolId
});

export const updateContentSchema = createContentSchema.partial();

export const createExamConfigSchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  subjects: z.array(z.string()).optional(),
  board: z.enum(["WAEC", "JAMB", "Mock"]),
  kind: z.enum(["paper", "mock_exam"]).optional(),
  durationMinutes: z.number().positive(),
  questionCount: z.number().positive(),
  hasCalculator: z.boolean().optional(),
  coinsReward: z.number().nonnegative().optional(),
  schoolId: z.string().nullable().optional(),
});

export const updateExamConfigSchema = createExamConfigSchema.partial();

export const createStoreItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  cost: z.number().positive(),
  kind: z.enum(["premium_time", "bonus_content", "cosmetic"]),
  comingSoon: z.boolean().optional(),
  schoolId: z.string().nullable().optional(),
});

export const updateStoreItemSchema = createStoreItemSchema.partial();
