import * as userService from "../services/user.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getMe = asyncHandler(async (req, res) => {
  const data = await userService.getMe(req.user._id);
  sendSuccess(res, { data });
});

export const updateMe = asyncHandler(async (req, res) => {
  const data = await userService.updateMe(req.user._id, req.body);
  sendSuccess(res, { data, message: "Profile updated" });
});

export const deleteMe = asyncHandler(async (req, res) => {
  await userService.deleteMe(req.user._id);
  sendSuccess(res, { data: null, message: "Account deleted" });
});
