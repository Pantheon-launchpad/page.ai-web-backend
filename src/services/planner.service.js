import StudyPlan from "../models/StudyPlan.js";
import ExamDate from "../models/ExamDate.js";
import Mastery from "../models/Mastery.js";
import Topic from "../models/Topic.js";

const startOfWeekIso = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
};

export const getPlanner = async (userId) => {
  const weekOf = startOfWeekIso();
  let plan = await StudyPlan.findOne({ userId });

  if (!plan) {
    plan = await StudyPlan.create({ userId, weekOf, dailyGoalMinutes: 60, entries: [] });
  }

  const [examDates, weakTopics] = await Promise.all([
    ExamDate.find({ userId }).sort({ date: 1 }),
    Mastery.find({ userId }).sort({ masteryScore: 1 }).limit(5).populate("topicId"),
  ]);

  return {
    weekOf: plan.weekOf,
    dailyGoalMinutes: plan.dailyGoalMinutes,
    entries: plan.entries,
    upcomingExams: examDates.map((e) => ({ id: e._id, examName: e.examName, date: e.date })),
    recommendations: weakTopics
      .filter((m) => m.topicId)
      .map((m) => ({
        topicId: m.topicId._id,
        topicName: m.topicId.name,
        masteryScore: m.masteryScore,
        reason: "Low mastery — recommended for revision this week",
      })),
  };
};
