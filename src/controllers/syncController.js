import * as syncService from "../services/sync.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getSyncState = asyncHandler(async (req, res) => {
  const data = await syncService.getSyncState(req.user._id, req.query.since);
  sendSuccess(res, { data });
});

export const postActions = asyncHandler(async (req, res) => {
  const data = await syncService.applyActions(req.user._id, req.body);
  sendSuccess(res, { data });
});
