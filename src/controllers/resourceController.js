import * as resourceService from "../services/resource.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const listResources = asyncHandler(async (req, res) => {
  const { type, subject, search } = req.query;
  const data = await resourceService.listResources(req.user._id, { type, subject, search });
  sendSuccess(res, { data });
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  const data = await resourceService.toggleBookmark(req.user._id, req.params.id, !!req.body.bookmarked);
  sendSuccess(res, { data });
});
