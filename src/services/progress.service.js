import mongoose from "mongoose";
import Attempt from "../models/Attempt.js";
import Mastery from "../models/Mastery.js";
import Subject from "../models/Subject.js";

/**
 * Aggregation-pipeline-driven analytics per API_CONTRACT.md §13. Computed
 * on-read here; the contract flags this as a candidate for a scheduled job
 * once volume grows (TECHNICAL_DOCUMENTATION.md §20) — documented, not
 * solved in this pass.
 */
export const getAnalytics = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);

  const [heatmap, accuracyTrend, topicPerformance, subjectDistribution] = await Promise.all([
    Attempt.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$attemptedAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Attempt.aggregate([
      { $match: { userId: uid } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$attemptedAt" } },
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", accuracy: { $divide: ["$correct", "$total"] }, _id: 0 } },
    ]),
    Attempt.aggregate([
      { $match: { userId: uid } },
      {
        $group: {
          _id: "$topicId",
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
        },
      },
      { $lookup: { from: "topics", localField: "_id", foreignField: "_id", as: "topic" } },
      { $unwind: { path: "$topic", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          topicId: "$_id",
          topicName: "$topic.name",
          total: 1,
          accuracy: { $divide: ["$correct", "$total"] },
          _id: 0,
        },
      },
      { $sort: { total: -1 } },
    ]),
    Attempt.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: "$subjectId", count: { $sum: 1 } } },
      { $lookup: { from: "subjects", localField: "_id", foreignField: "_id", as: "subject" } },
      { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },
      { $project: { subjectId: "$_id", subjectName: "$subject.name", count: 1, _id: 0 } },
    ]),
  ]);

  return { heatmap, accuracyTrend, topicPerformance, subjectDistribution };
};

export const getWeakAreas = async (userId) => {
  const weak = await Mastery.find({ userId, masteryScore: { $lt: 0.5 } })
    .sort({ masteryScore: 1 })
    .limit(10)
    .populate("topicId");

  return weak
    .filter((m) => m.topicId)
    .map((m) => ({
      topicId: m.topicId._id,
      topicName: m.topicId.name,
      masteryScore: m.masteryScore,
    }));
};
