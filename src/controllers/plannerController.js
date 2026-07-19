import * as plannerService from "../services/planner.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getPlanner = asyncHandler(async (req, res) => {
  const data = await plannerService.getPlanner(req.user._id);
  sendSuccess(res, { data });
});
