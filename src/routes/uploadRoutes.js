import express from "express";
import * as uploadController from "../controllers/uploadController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { signUploadSchema, confirmUploadSchema } from "../validators/upload.validators.js";

const router = express.Router();
router.use(requireAuth);
router.post("/sign", validate({ body: signUploadSchema }), uploadController.signUpload);
router.post("/:fileId/confirm", validate({ body: confirmUploadSchema }), uploadController.confirmUpload);
export default router;
