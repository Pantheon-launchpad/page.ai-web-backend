import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "name must be at least 2 characters"),
  email: z.string().trim().email("invalid email"),
  password: z.string().min(6, "password must be at least 6 characters"),
  classLevel: z.string().optional(),
  targetExams: z.array(z.string()).optional(),
  focusSubjects: z.array(z.string()).optional(),
  referralCode: z.string().optional(),
  schoolCode: z.string().optional(), // joins the student to a School tenant, see services/school.service.js
});

export const loginSchema = z.object({
  email: z.string().trim().email("invalid email"),
  password: z.string().min(1, "password is required"),
  rememberMe: z.boolean().optional(),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(10, "idToken is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, "refreshToken is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("invalid email"),
});
