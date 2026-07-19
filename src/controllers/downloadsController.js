import * as downloadsService from "../services/downloads.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const listDownloads = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await downloadsService.listDownloads(req.user._id) });
});

export const deleteDownload = asyncHandler(async (req, res) => {
  await downloadsService.deleteDownload(req.user._id, req.params.id);
  sendSuccess(res, { data: null, message: "Download removed" });
});
