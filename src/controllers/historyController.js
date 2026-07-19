import * as historyService from "../services/history.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const pageSize = parseInt(req.query.pageSize || "30", 10);
  sendSuccess(res, { data: await historyService.getHistory(req.user._id, { page, pageSize }) });
});
