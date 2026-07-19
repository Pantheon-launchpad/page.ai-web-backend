import { z } from "zod";

export const updateSettingsSchema = z.object({
  notifications: z
    .object({
      dailyReminder: z.boolean().optional(),
      streakAlerts: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
      achievementAlerts: z.boolean().optional(),
    })
    .partial()
    .optional(),
  study: z
    .object({
      dailyGoalMinutes: z.number().int().positive().optional(),
      difficultyPreference: z.enum(["easy", "adaptive", "hard"]).optional(),
    })
    .partial()
    .optional(),
  theme: z.enum(["light", "dark", "soft", "system"]).optional(),
});
