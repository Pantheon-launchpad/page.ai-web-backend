import express from "express";
import * as syncController from "../controllers/syncController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { syncStateQuerySchema, syncActionsBatchSchema } from "../validators/sync.validators.js";

const router = express.Router();
router.use(requireAuth);

// GET /sync/state?since=<ISO> — full sync if `since` is omitted.
router.get("/state", validate({ query: syncStateQuerySchema }), syncController.getSyncState);

// POST /sync/actions — replay a batch of actions recorded while offline.
router.post("/actions", validate({ body: syncActionsBatchSchema }), syncController.postActions);

export default router;
