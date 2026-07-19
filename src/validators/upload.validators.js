import { z } from "zod";

export const signUploadSchema = z.object({
  fileName: z.string().min(1),
  kind: z.enum(["image", "pdf", "video", "document"]),
});

export const confirmUploadSchema = z.object({
  sizeBytes: z.number().nonnegative().optional(),
  mimeType: z.string().optional(),
});
