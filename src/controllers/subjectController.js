import * as subjectService from "../services/subject.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const listSubjects = asyncHandler(async (req, res) => {
  const data = await subjectService.listSubjects(req.user._id);
  sendSuccess(res, { data });
});

export const getSubject = asyncHandler(async (req, res) => {
  const data = await subjectService.getSubject(req.user._id, req.params.id);
  sendSuccess(res, { data });
});
