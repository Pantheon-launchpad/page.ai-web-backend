import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  school: z.string().optional(),
  classLevel: z.string().optional(),
  targetExams: z.array(z.string()).optional(),
  focusSubjects: z.array(z.string()).optional(),
  avatar: z.string().optional(),
});
