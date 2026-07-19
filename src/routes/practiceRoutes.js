import express from "express";
import * as practiceController from "../controllers/practiceController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { questionsQuerySchema, recordAttemptSchema } from "../validators/practice.validators.js";

const router = express.Router();
router.use(requireAuth);
router.get("/subjects", practiceController.listSubjects);
router.get("/subjects/:subject/topics", practiceController.listTopics);
router.get("/questions", validate({ query: questionsQuerySchema }), practiceController.listQuestions);
router.post("/attempts", validate({ body: recordAttemptSchema }), practiceController.recordAttempt);
export default router;
