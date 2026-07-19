import express from "express";
import * as streakController from "../controllers/streakController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/", requireAuth, streakController.getStreak);
export default router;
