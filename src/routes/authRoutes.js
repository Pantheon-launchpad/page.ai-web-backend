import express from "express";
import * as authController from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.middleware.js";
import { optionalAuth } from "../middleware/auth.middleware.js";
import {
  signupSchema,
  loginSchema,
  googleAuthSchema,
  refreshSchema,
  forgotPasswordSchema,
} from "../validators/auth.validators.js";

const router = express.Router();

router.post("/signup", authLimiter, validate({ body: signupSchema }), authController.signup);
router.post("/login", authLimiter, validate({ body: loginSchema }), authController.login);
router.post("/google", authLimiter, validate({ body: googleAuthSchema }), authController.googleAuth);
router.post("/refresh", validate({ body: refreshSchema }), authController.refresh);
router.post("/logout", authController.logout);
router.post(
  "/forgot-password",
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);
router.get("/session", optionalAuth, authController.session);

export default router;
