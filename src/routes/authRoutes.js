import express from "express";
import { register, login, googleCallback } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import passport from "passport";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
    '/google/callback',
    passport.authenticate('google' , { session: false }),
    googleCallback
)

export default router;
