import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.enum(["again", "hard", "good", "easy"]),
});

export const generateDeckSchema = z.object({
  topic: z.string().min(1),
  subjectId: z.string().optional(),
  cardCount: z.number().int().min(1).max(30).default(10).optional(),
});
