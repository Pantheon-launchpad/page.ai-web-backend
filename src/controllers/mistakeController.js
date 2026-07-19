import * as mistakeService from "../services/mistake.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const listMistakes = asyncHandler(async (req, res) => {
  const data = await mistakeService.listMistakes(req.user._id, req.query);
  sendSuccess(res, { data });
});
