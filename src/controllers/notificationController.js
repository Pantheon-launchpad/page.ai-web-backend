import * as notificationService from "../services/notification.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const listNotifications = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await notificationService.listNotifications(req.user._id) });
});

export const markRead = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await notificationService.markRead(req.user._id, req.params.id) });
});

export const markAllRead = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await notificationService.markAllRead(req.user._id) });
});
