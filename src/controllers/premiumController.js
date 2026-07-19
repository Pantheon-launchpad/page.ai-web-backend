import * as premiumService from "../services/premium.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getPlans = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await premiumService.getPlans(req.user._id) });
});

export const upgrade = asyncHandler(async (req, res) => {
  const data = await premiumService.upgrade();
  sendSuccess(res, { data });
});
