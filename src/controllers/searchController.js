import * as searchService from "../services/search.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const search = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await searchService.search(req.query.q) });
});
