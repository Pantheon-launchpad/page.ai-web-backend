import * as uploadService from "../services/upload.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const signUpload = asyncHandler(async (req, res) => {
  const data = await uploadService.signUpload(req.user._id, req.body);
  sendSuccess(res, { data, status: 201 });
});

export const confirmUpload = asyncHandler(async (req, res) => {
  const data = await uploadService.confirmUpload(req.user._id, req.params.fileId, req.body);
  sendSuccess(res, { data, message: "Upload confirmed" });
});
