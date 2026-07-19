import express from "express";
import * as aiController from "../controllers/aiController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.middleware.js";
import { chatSchema, remediateSchema, mnemonicSchema } from "../validators/ai.validators.js";

const router = express.Router();
router.use(requireAuth, aiLimiter);

router.post("/chat", validate({ body: chatSchema }), aiController.chat);
router.post("/chat/stream", validate({ body: chatSchema }), aiController.chatStream);
router.post("/remediate", validate({ body: remediateSchema }), aiController.remediate);
router.post("/mnemonic", validate({ body: mnemonicSchema }), aiController.mnemonic);
router.post("/vision", aiController.vision);
router.post("/documents", aiController.documents);

export default router;
