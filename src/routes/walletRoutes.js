import express from "express";
import * as walletController from "../controllers/walletController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/", walletController.getWallet);
router.get("/missions", walletController.getMissions);
router.post("/missions/:id/claim", walletController.claimMission);
router.get("/rewards/recent", walletController.getRecentRewards);
router.get("/store", walletController.getStoreItems);
router.post("/store/:itemId/redeem", walletController.redeemItem);
router.get("/breakdown", walletController.getBreakdown);
router.get("/transactions", walletController.getTransactions);
export default router;
