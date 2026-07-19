import * as walletService from "../services/wallet.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import ActivityLog from "../models/ActivityLog.js";

export const getWallet = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await walletService.getWalletSummary(req.user._id) });
});

export const getMissions = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await walletService.getMissions(req.user._id) });
});

export const claimMission = asyncHandler(async (req, res) => {
  const data = await walletService.claimMission(req.user._id, req.params.id);
  await ActivityLog.create({ userId: req.user._id, type: "mission_claim", label: "Claimed a mission reward" });
  sendSuccess(res, { data });
});

export const getRecentRewards = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await walletService.getRecentRewards(req.user._id) });
});

export const getStoreItems = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await walletService.getStoreItems() });
});

export const redeemItem = asyncHandler(async (req, res) => {
  const data = await walletService.redeemItem(req.user._id, req.params.itemId);
  await ActivityLog.create({ userId: req.user._id, type: "store_redeem", label: "Redeemed a store item" });
  sendSuccess(res, { data });
});

export const getBreakdown = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await walletService.getBreakdown(req.user._id) });
});

export const getTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const pageSize = parseInt(req.query.pageSize || "20", 10);
  sendSuccess(res, { data: await walletService.getTransactions(req.user._id, { page, pageSize }) });
});
