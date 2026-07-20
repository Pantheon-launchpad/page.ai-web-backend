import ExamConfig from "../models/ExamConfig.js";
import ExamAttempt from "../models/ExamAttempt.js";
import Question from "../models/Question.js";
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { awardCoins } from "./wallet.service.js";
import { bumpStreak } from "./streak.service.js";
import { tenantVisibilityFilter } from "../utils/tenantFilter.js";

export const listPapers = async (user) => {
  const papers = await ExamConfig.find({ kind: "paper", ...tenantVisibilityFilter(user) });
  return papers.map(serializeConfig);
};

export const listMockExams = async (user) => {
  const exams = await ExamConfig.find({ kind: "mock_exam", ...tenantVisibilityFilter(user) });
  return exams.map(serializeConfig);
};

const serializeConfig = (e) => ({
  id: e._id,
  title: e.title,
  subject: e.subject,
  subjects: e.subjects,
  board: e.board,
  durationMinutes: e.durationMinutes,
  questionCount: e.questionCount,
  hasCalculator: e.hasCalculator,
});

/**
 * A school-exclusive exam (schoolId set) must not be accessible to a user
 * outside that school, even if they guess/share the examId directly —
 * listPapers/listMockExams already hide it from listings, but that alone
 * doesn't stop a direct GET/POST by id, hence this explicit check. Takes a
 * userId (not a full user doc) so callers — including the offline sync
 * replay path in services/sync.service.js — don't need to thread a full
 * req.user through; it's looked up once here instead.
 */
const assertExamAccessible = async (exam, userId) => {
  if (!exam.schoolId) return; // platform-wide — always accessible
  const requester = await User.findById(userId).select("schoolId");
  if (!requester?.schoolId || requester.schoolId.toString() !== exam.schoolId.toString()) {
    throw ApiError.forbidden("This exam is exclusive to another school");
  }
};

export const getExamQuestions = async (userId, examId) => {
  const exam = await ExamConfig.findById(examId);
  if (!exam) throw ApiError.notFound("Exam not found");
  await assertExamAccessible(exam, userId);

  const questions = await Question.find({ examConfigId: examId }).limit(exam.questionCount);
  return questions.map((q) => ({
    id: q._id,
    stem: q.stem,
    options: q.options.map((o) => ({ id: o._id, label: o.label, text: o.text })),
  }));
};

// Basic anti-abuse: block a second submission of the same exam within 5 minutes.
const RESUBMIT_WINDOW_MS = 5 * 60 * 1000;

export const submitExam = async (userId, examId, { answers, timeTakenSeconds }) => {
  const exam = await ExamConfig.findById(examId);
  if (!exam) throw ApiError.notFound("Exam not found");
  await assertExamAccessible(exam, userId);

  const recent = await ExamAttempt.findOne({ userId, examConfigId: examId }).sort({ submittedAt: -1 });
  if (recent && Date.now() - new Date(recent.submittedAt).getTime() < RESUBMIT_WINDOW_MS) {
    throw ApiError.badRequest("This exam was already submitted recently. Please wait before retrying.");
  }

  const maxTime = exam.durationMinutes * 60 * 1.1; // allow 10% grace over the stated duration
  const sanitizedTime = Math.min(timeTakenSeconds, maxTime);

  const questions = await Question.find({ examConfigId: examId });
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  for (const question of questions) {
    const chosenIndex = answers[question._id.toString()];
    if (chosenIndex === null || chosenIndex === undefined) {
      skipped += 1;
      continue;
    }
    const chosen = question.options[chosenIndex];
    if (chosen?.isCorrect) correct += 1;
    else wrong += 1;
  }

  const total = questions.length;
  const scorePercent = total ? correct / total : 0;
  const coinsEarned = Math.round(exam.coinsReward * scorePercent);

  const attempt = await ExamAttempt.create({
    userId,
    examConfigId: examId,
    answers,
    correct,
    wrong,
    skipped,
    total,
    timeTakenSeconds: sanitizedTime,
    coinsEarned,
  });

  await Promise.all([
    ActivityLog.create({ userId, type: "cbt_submit", label: `Submitted ${exam.title}` }),
    bumpStreak(userId),
    coinsEarned > 0 ? awardCoins(userId, coinsEarned, `CBT: ${exam.title}`, "cbt") : Promise.resolve(),
  ]);

  return { correct, wrong, skipped, total, coinsEarned, attemptId: attempt._id };
};
