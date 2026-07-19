import express from "express";
import * as notificationController from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/", notificationController.listNotifications);
router.post("/:id/read", notificationController.markRead);
router.post("/read-all", notificationController.markAllRead);
export default router;
