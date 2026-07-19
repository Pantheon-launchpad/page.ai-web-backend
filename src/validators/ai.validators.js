import { z } from "zod";

export const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string() }))
    .min(1),
});

export const remediateSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  questionStem: z.string(),
  studentChosenOption: z.string(),
  correctOption: z.string(),
  masteryScore: z.number().min(0).max(1),
  readingLevelHint: z.string().optional(),
  recentMistakesSameTopic: z.number().optional(),
});

export const mnemonicSchema = z.object({
  concept: z.string().min(1),
  subject: z.string().min(1),
});

export const tutorMessageSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});
