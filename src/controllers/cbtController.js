import * as cbtService from "../services/cbt.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const listPapers = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await cbtService.listPapers(req.user) });
});

export const listMockExams = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await cbtService.listMockExams(req.user) });
});

export const getExamQuestions = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await cbtService.getExamQuestions(req.user._id, req.params.examId) });
});

export const submitExam = asyncHandler(async (req, res) => {
  const data = await cbtService.submitExam(req.user._id, req.params.examId, req.body);
  sendSuccess(res, { data });
});
