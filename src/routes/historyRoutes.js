import express from "express";
import * as historyController from "../controllers/historyController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/", requireAuth, historyController.getHistory);
export default router;
