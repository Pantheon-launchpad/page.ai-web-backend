import express from "express";
import * as progressController from "../controllers/progressController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/analytics", progressController.getAnalytics);
router.get("/weak-areas", progressController.getWeakAreas);
export default router;
