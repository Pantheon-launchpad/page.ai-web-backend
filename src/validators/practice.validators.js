import { z } from "zod";

export const questionsQuerySchema = z.object({
  subject: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.coerce.number().min(1).max(5).optional(),
});

export const recordAttemptSchema = z.object({
  questionId: z.string().min(1),
  chosenIndex: z.number().int().min(-1),
});
