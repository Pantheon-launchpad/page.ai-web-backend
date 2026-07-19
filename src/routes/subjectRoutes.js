import express from "express";
import * as subjectController from "../controllers/subjectController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/", subjectController.listSubjects);
router.get("/:id", subjectController.getSubject);
export default router;
