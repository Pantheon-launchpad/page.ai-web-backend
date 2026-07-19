import express from "express";
import * as userController from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateProfileSchema } from "../validators/user.validators.js";

const router = express.Router();

router.use(requireAuth);
router.get("/me", userController.getMe);
router.patch("/me", validate({ body: updateProfileSchema }), userController.updateMe);
router.delete("/me", userController.deleteMe);

export default router;
