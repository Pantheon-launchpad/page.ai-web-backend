import rateLimit from "express-rate-limit";
import { ERROR_CODES } from "../constants/errorCodes.js";

const errorBody = (message) => ({ message, code: ERROR_CODES.RATE_LIMITED });

// Brute-force protection on auth endpoints (register/login/forgot-password)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorBody("Too many attempts, try again later"),
});

// Generic API-wide limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorBody("Too many requests, slow down"),
});

// AI endpoints are the most expensive/abusable — tighter per-IP window on top
// of the per-user daily cap enforced in services/ai (see AI Architecture).
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorBody("Too many AI requests, slow down"),
});
