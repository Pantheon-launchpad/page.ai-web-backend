import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";
import Mastery from "../models/Mastery.js";
import Mistake from "../models/Mistake.js";
import UserSubjectProgress from "../models/UserSubjectProgress.js";
import ActivityLog from "../models/ActivityLog.js";
import { AiService } from "./ai/index.js";
import { ApiError } from "../utils/ApiError.js";
import { awardCoins } from "./wallet.service.js";
import { bumpStreak } from "./streak.service.js";

export const listSubjects = async () => {
  const subjects = await Subject.find().sort({ name: 1 });
  return subjects.map((s) => ({ id: s._id, name: s.name, icon: s.icon, color: s.color }));
};

export const listTopics = async (subjectName) => {
  const subject = await Subject.findOne({ name: subjectName });
  if (!subject) throw ApiError.notFound("Subject not found");
  const topics = await Topic.find({ subjectId: subject._id });
  return topics.map((t) => ({ id: t._id, name: t.name }));
};

export const listQuestions = async ({ subject, topic, difficulty }) => {
  const filter = {};
  if (subject) {
    const s = await Subject.findOne({ name: subject });
    if (s) filter.subjectId = s._id;
  }
  if (topic) {
    const t = await Topic.findOne({ name: topic });
    if (t) filter.topicId = t._id;
  }
  if (difficulty) filter.difficulty = difficulty;

  const questions = await Question.find(filter).limit(50);
  return questions.map((q) => ({
    id: q._id,
    stem: q.stem,
    difficulty: q.difficulty,
    options: q.options.map((o) => ({ id: o._id, label: o.label, text: o.text })),
  }));
};

/**
 * Mastery heuristic per API_CONTRACT.md §10: 2 consecutive correct → treat
 * as ready for harder material; 2 consecutive wrong → back off. masteryScore
 * itself moves by a small step per attempt so it's a smooth signal, while
 * the consecutive counters drive the "which difficulty next" hint the
 * frontend can use.
 */
const applyMasteryUpdate = async (userId, topicId, isCorrect) => {
  let mastery = await Mastery.findOne({ userId, topicId });
  if (!mastery) mastery = new Mastery({ userId, topicId, masteryScore: 0.5 });

  const STEP = 0.08;
  if (isCorrect) {
    mastery.consecutiveCorrect += 1;
    mastery.consecutiveWrong = 0;
    mastery.masteryScore = Math.min(1, mastery.masteryScore + STEP);
  } else {
    mastery.consecutiveWrong += 1;
    mastery.consecutiveCorrect = 0;
    mastery.masteryScore = Math.max(0, mastery.masteryScore - STEP);
  }
  await mastery.save();

  return {
    masteryScore: mastery.masteryScore,
    suggestedDifficultyShift:
      mastery.consecutiveCorrect >= 2 ? "harder" : mastery.consecutiveWrong >= 2 ? "easier" : "same",
  };
};

export const recordAttempt = async (userId, { questionId, chosenIndex }) => {
  const question = await Question.findById(questionId);
  if (!question) throw ApiError.notFound("Question not found");

  const chosenOption = chosenIndex >= 0 ? question.options[chosenIndex] : null;
  const isCorrect = !!chosenOption?.isCorrect;

  const attempt = await Attempt.create({
    userId,
    questionId,
    topicId: question.topicId,
    subjectId: question.subjectId,
    chosenOptionId: chosenOption?._id || null,
    isCorrect,
  });

  const [{ masteryScore, suggestedDifficultyShift }] = await Promise.all([
    applyMasteryUpdate(userId, question.topicId, isCorrect),
    ActivityLog.create({ userId, type: "practice_attempt", label: "Practice attempt" }),
    bumpStreak(userId),
  ]);

  await UserSubjectProgress.updateOne(
    { userId, subjectId: question.subjectId },
    {
      $inc: { questionsAttempted: 1, questionsCorrect: isCorrect ? 1 : 0 },
      $set: { masteryScore, lastStudiedAt: new Date() },
    },
    { upsert: true },
  );

  let mistake = null;
  if (!isCorrect) {
    const correctOption = question.options.find((o) => o.isCorrect);
    const remediation = await AiService.remediate({
      subject: (await question.populate("subjectId")).subjectId?.name || "",
      topic: (await question.populate("topicId")).topicId?.name || "",
      questionStem: question.stem,
      studentChosenOption: chosenOption?.text || "(skipped)",
      correctOption: correctOption?.text || "",
      masteryScore,
    });

    mistake = await Mistake.create({
      attemptId: attempt._id,
      userId,
      subjectId: question.subjectId,
      misconceptionSummary: remediation.misconceptionSummary,
      mnemonic: remediation.mnemonic,
    });
  } else {
    await awardCoins(userId, 2, "Correct practice answer", "practice");
  }

  return {
    isCorrect,
    correctOptionId: question.options.find((o) => o.isCorrect)?._id,
    masteryScore,
    suggestedDifficultyShift,
    mistakeId: mistake?._id,
  };
};
