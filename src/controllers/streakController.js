import * as streakService from "../services/streak.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getStreak = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await streakService.getStreak(req.user._id) });
});
