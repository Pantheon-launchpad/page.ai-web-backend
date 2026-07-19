import { z } from "zod";

export const tutorMessageSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});
