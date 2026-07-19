import express from "express";
import * as helpController from "../controllers/helpController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { contactSupportSchema } from "../validators/help.validators.js";

const router = express.Router();
router.get("/faqs", helpController.getFaqs);
router.post("/contact", requireAuth, validate({ body: contactSupportSchema }), helpController.contactSupport);
export default router;
