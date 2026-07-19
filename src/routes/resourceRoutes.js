import express from "express";
import * as resourceController from "../controllers/resourceController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/", resourceController.listResources);
router.post("/:id/bookmark", resourceController.toggleBookmark);
export default router;
