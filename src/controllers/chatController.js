import * as chatService from "../services/chat.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const listSources = asyncHandler(async (req, res) => {
  const data = await chatService.listSources(req.user._id);
  sendSuccess(res, { data });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const data = await chatService.sendMessage(req.user._id, req.params.sourceId, req.body.message);
  sendSuccess(res, { data });
});

// Multipart upload registers the file via the shared upload service flow,
// then wraps it as a chat source in one step, per API_CONTRACT.md §7.
export const uploadSource = asyncHandler(async (req, res) => {
  const data = await chatService.registerUploadedSource(req.user._id, req.body);
  sendSuccess(res, { data, status: 201 });
});
