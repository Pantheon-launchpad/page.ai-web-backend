import express from "express";
import * as achievementController from "../controllers/achievementController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/", requireAuth, achievementController.listAchievements);
export default router;
