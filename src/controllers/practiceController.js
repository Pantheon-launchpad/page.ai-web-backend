import * as practiceService from "../services/practice.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const listSubjects = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await practiceService.listSubjects() });
});

export const listTopics = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await practiceService.listTopics(req.params.subject) });
});

export const listQuestions = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await practiceService.listQuestions(req.query) });
});

export const recordAttempt = asyncHandler(async (req, res) => {
  const data = await practiceService.recordAttempt(req.user._id, req.body);
  sendSuccess(res, { data, status: 201 });
});
