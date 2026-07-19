import ChatSource from "../models/ChatSource.js";
import ChatMessage from "../models/ChatMessage.js";
import UploadedFile from "../models/UploadedFile.js";
import { AiService } from "./ai/index.js";
import { ApiError } from "../utils/ApiError.js";

export const listSources = async (userId) => {
  const sources = await ChatSource.find({ userId }).sort({ createdAt: -1 });
  return sources.map((s) => ({ id: s._id, title: s.title, kind: s.kind, status: s.status }));
};

export const registerUploadedSource = async (userId, { title, fileId }) => {
  const file = await UploadedFile.findOne({ _id: fileId, userId, status: "confirmed" });
  if (!file) throw ApiError.badRequest("File must be uploaded and confirmed first (see /uploads/sign)");

  const source = await ChatSource.create({
    userId,
    title,
    fileId,
    kind: "uploaded_doc",
    status: "ready",
  });
  return { id: source._id, title: source.title, kind: source.kind, status: source.status };
};

export const sendMessage = async (userId, sourceId, message) => {
  const source = await ChatSource.findOne({ _id: sourceId, userId });
  if (!source) throw ApiError.notFound("Chat source not found");

  await ChatMessage.create({ sourceId, userId, role: "user", content: message });

  const history = await ChatMessage.find({ sourceId }).sort({ createdAt: 1 }).limit(20);
  const reply = await AiService.chat(
    history.map((m) => ({ role: m.role, content: m.content })),
  );

  await ChatMessage.create({ sourceId, userId, role: "assistant", content: reply });
  return { reply };
};
