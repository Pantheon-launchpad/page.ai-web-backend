import express from "express";
import * as tutorController from "../controllers/tutorController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.middleware.js";
import { tutorMessageSchema } from "../validators/tutor.validators.js";

const router = express.Router();
router.use(requireAuth);
router.get("/capabilities", tutorController.getCapabilities);
router.post("/message", aiLimiter, validate({ body: tutorMessageSchema }), tutorController.sendMessage);
export default router;
