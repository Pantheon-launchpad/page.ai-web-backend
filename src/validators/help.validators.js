import { z } from "zod";

export const contactSupportSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(1),
});
