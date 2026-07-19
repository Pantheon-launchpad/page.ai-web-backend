import express from "express";
import * as premiumController from "../controllers/premiumController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/plans", premiumController.getPlans);
router.post("/upgrade", premiumController.upgrade);
export default router;
