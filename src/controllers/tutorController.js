import { AiService } from "../services/ai/index.js";
import * as aiUsage from "../services/aiUsage.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const CAPABILITIES = [
  { key: "explain", title: "Explain a concept", icon: "book-open", promptChips: ["Explain photosynthesis simply", "What is Newton's second law?"] },
  { key: "practice", title: "Practice questions", icon: "pencil", promptChips: ["Give me 3 practice questions on quadratic equations"] },
  { key: "revise", title: "Revision plan", icon: "calendar", promptChips: ["Help me plan revision for WAEC Chemistry"] },
  { key: "mnemonic", title: "Memory aid", icon: "sparkles", promptChips: ["Give me a mnemonic for the noble gases"] },
];

export const getCapabilities = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { capabilities: CAPABILITIES } });
});

export const sendMessage = asyncHandler(async (req, res) => {
  await aiUsage.assertWithinDailyLimit(req.user._id);
  const { message } = req.body;
  const reply = await AiService.chat([{ role: "user", content: message }]);
  await aiUsage.recordUsage(req.user._id, "ai_tutor_message");
  sendSuccess(res, { data: { reply } });
});
