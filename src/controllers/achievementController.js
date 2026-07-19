import * as achievementService from "../services/achievement.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const listAchievements = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await achievementService.listAchievements(req.user._id) });
});
