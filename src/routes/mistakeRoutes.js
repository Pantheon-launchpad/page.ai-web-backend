import express from "express";
import * as mistakeController from "../controllers/mistakeController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/", requireAuth, mistakeController.listMistakes);
export default router;
