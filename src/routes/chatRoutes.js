import express from "express";
import * as chatController from "../controllers/chatController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.middleware.js";
import { chatMessageSchema, registerChatSourceSchema } from "../validators/chat.validators.js";

const router = express.Router();
router.use(requireAuth);
router.get("/sources", chatController.listSources);
router.post("/:sourceId/message", aiLimiter, validate({ body: chatMessageSchema }), chatController.sendMessage);
router.post("/upload", validate({ body: registerChatSourceSchema }), chatController.uploadSource);
export default router;
