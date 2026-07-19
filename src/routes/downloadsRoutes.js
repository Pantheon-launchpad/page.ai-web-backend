import express from "express";
import * as downloadsController from "../controllers/downloadsController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/", downloadsController.listDownloads);
router.delete("/:id", downloadsController.deleteDownload);
export default router;
