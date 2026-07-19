import { AiService } from "../services/ai/index.js";
import * as aiUsage from "../services/aiUsage.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const chat = asyncHandler(async (req, res) => {
  await aiUsage.assertWithinDailyLimit(req.user._id);
  const reply = await AiService.chat(req.body.messages);
  await aiUsage.recordUsage(req.user._id, "ai_chat");
  sendSuccess(res, { data: { reply } });
});

// SSE token-streamed variant. The local provider doesn't truly stream tokens
// from a model, so this chunks the single-shot reply to preserve the wire
// contract (text/event-stream) for frontend integration/testing.
export const chatStream = asyncHandler(async (req, res) => {
  await aiUsage.assertWithinDailyLimit(req.user._id);
  const reply = await AiService.chat(req.body.messages);
  await aiUsage.recordUsage(req.user._id, "ai_chat_stream");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const words = reply.split(" ");
  for (const word of words) {
    res.write(`data: ${JSON.stringify({ token: word + " " })}\n\n`);
  }
  res.write("data: [DONE]\n\n");
  res.end();
});

export const remediate = asyncHandler(async (req, res) => {
  await aiUsage.assertWithinDailyLimit(req.user._id);
  const result = await AiService.remediate(req.body);
  await aiUsage.recordUsage(req.user._id, "ai_remediate");
  sendSuccess(res, { data: result });
});

export const mnemonic = asyncHandler(async (req, res) => {
  const { concept, subject } = req.body;
  const result = await AiService.mnemonic(concept, subject);
  sendSuccess(res, { data: { mnemonic: result } });
});

export const vision = asyncHandler(async () => {
  throw ApiError.badRequest("Vision/document AI understanding is not implemented in this deployment yet");
});

export const documents = asyncHandler(async () => {
  throw ApiError.badRequest("Long-document AI processing is not implemented in this deployment yet");
});
