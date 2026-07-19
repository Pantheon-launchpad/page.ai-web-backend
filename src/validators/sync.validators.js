import { z } from "zod";

export const syncStateQuerySchema = z.object({
  since: z.string().datetime().optional(),
});

export const syncActionSchema = z.object({
  clientActionId: z.string().min(1),
  type: z.enum([
    "practice_attempt",
    "cbt_submit",
    "flashcard_review",
    "mission_claim",
    "settings_update",
    "study_plan_update",
  ]),
  payload: z.record(z.any()),
  occurredAt: z.string().datetime(),
});

export const syncActionsBatchSchema = z.object({
  deviceId: z.string().min(1),
  actions: z.array(syncActionSchema).min(1).max(200),
});
