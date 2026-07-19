import * as settingsService from "../services/settings.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getSettings = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await settingsService.getSettings(req.user._id) });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.updateSettings(req.user._id, req.body);
  sendSuccess(res, { data, message: "Settings updated" });
});
