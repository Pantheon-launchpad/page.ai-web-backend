import * as progressService from "../services/progress.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getAnalytics = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await progressService.getAnalytics(req.user._id) });
});

export const getWeakAreas = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await progressService.getWeakAreas(req.user._id) });
});
