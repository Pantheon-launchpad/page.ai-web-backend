import express from "express";
import * as referralController from "../controllers/referralController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { applyReferralSchema } from "../validators/referral.validators.js";

const router = express.Router();
router.get("/", requireAuth, referralController.getMyReferral);
router.get("/recent", requireAuth, referralController.getRecentReferred);
// Public per contract ("applied during signup") but still needs an
// authenticated actor to attribute the referral to — requireAuth here since
// signup itself applies codes inline via auth.service.js; this endpoint
// covers the case of applying a code to an already-created account.
router.post("/apply", requireAuth, validate({ body: applyReferralSchema }), referralController.applyCode);
export default router;
