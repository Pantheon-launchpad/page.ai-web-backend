import Mistake from "../models/Mistake.js";

export const listMistakes = async (userId, { subject } = {}) => {
  const filter = { userId };
  if (subject) filter.subjectId = subject;

  const mistakes = await Mistake.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("subjectId", "name icon color")
    .populate({ path: "attemptId", populate: { path: "questionId", select: "stem" } });

  return mistakes.map((m) => ({
    id: m._id,
    subject: m.subjectId,
    question: m.attemptId?.questionId?.stem,
    misconceptionSummary: m.misconceptionSummary,
    mnemonic: m.mnemonic,
    resolved: m.resolved,
    createdAt: m.createdAt,
  }));
};
