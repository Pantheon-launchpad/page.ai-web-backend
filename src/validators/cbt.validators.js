import { z } from "zod";

export const submitExamSchema = z.object({
  answers: z.record(z.union([z.number(), z.null()])),
  timeTakenSeconds: z.number().nonnegative(),
});
