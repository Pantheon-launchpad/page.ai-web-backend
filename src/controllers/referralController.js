import * as referralService from "../services/referral.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getMyReferral = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await referralService.getMyReferral(req.user._id) });
});

export const getRecentReferred = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await referralService.getRecentReferred(req.user._id) });
});

export const applyCode = asyncHandler(async (req, res) => {
  const data = await referralService.applyCode(req.user._id, req.body.code);
  sendSuccess(res, { data });
});
