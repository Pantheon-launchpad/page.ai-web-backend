import * as helpService from "../services/help.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getFaqs = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await helpService.getFaqs() });
});

export const contactSupport = asyncHandler(async (req, res) => {
  const data = await helpService.contactSupport(req.user._id, req.body);
  sendSuccess(res, { data, status: 201, message: "Support ticket created" });
});
