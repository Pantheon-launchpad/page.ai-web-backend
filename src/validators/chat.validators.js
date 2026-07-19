import { z } from "zod";

export const chatMessageSchema = z.object({
  message: z.string().min(1),
});

export const registerChatSourceSchema = z.object({
  title: z.string().min(1),
  fileId: z.string().min(1),
});
