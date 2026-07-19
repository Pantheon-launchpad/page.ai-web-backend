import { z } from "zod";

export const applyReferralSchema = z.object({
  code: z.string().min(3),
});
