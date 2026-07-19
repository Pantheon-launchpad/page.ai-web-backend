import * as dashboardService from "../services/dashboard.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard(req.user._id);
  sendSuccess(res, { data });
});
