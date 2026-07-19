import express from "express";
import * as plannerController from "../controllers/plannerController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/", requireAuth, plannerController.getPlanner);
export default router;
