import express from "express";
import * as dashboardController from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/", requireAuth, dashboardController.getDashboard);
export default router;
