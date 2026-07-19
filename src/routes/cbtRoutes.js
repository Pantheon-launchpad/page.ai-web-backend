import express from "express";
import * as cbtController from "../controllers/cbtController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { submitExamSchema } from "../validators/cbt.validators.js";

const router = express.Router();
router.use(requireAuth);
router.get("/papers", cbtController.listPapers);
router.get("/mock-exams", cbtController.listMockExams);
router.get("/:examId/questions", cbtController.getExamQuestions);
router.post("/:examId/submit", validate({ body: submitExamSchema }), cbtController.submitExam);
export default router;
