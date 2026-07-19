import express from "express";
import * as searchController from "../controllers/searchController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/", requireAuth, searchController.search);
export default router;
