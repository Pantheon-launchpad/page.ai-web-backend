import express from "express";
import * as settingsController from "../controllers/settingsController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateSettingsSchema } from "../validators/settings.validators.js";

const router = express.Router();
router.use(requireAuth);
router.get("/", settingsController.getSettings);
router.patch("/", validate({ body: updateSettingsSchema }), settingsController.updateSettings);
export default router;
