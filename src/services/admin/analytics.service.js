import User from "../../models/User.js";
import Attempt from "../../models/Attempt.js";
import ExamAttempt from "../../models/ExamAttempt.js";
import Subject from "../../models/Subject.js";

/**
 * Live aggregation for now. Per TECHNICAL_DOCUMENTATION.md §20, production
 * should move this to a scheduled `platform_stats_daily` job once traffic
 * makes live aggregation expensive — flagged, not solved, in this pass.
 */
export const getPlatformAnalytics = async () => {
  const [usersByRole, subjectPopularity, examAvgScores] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Attempt.aggregate([
      { $group: { _id: "$subjectId", count: { $sum: 1 } } },
      { $lookup: { from: "subjects", localField: "_id", foreignField: "_id", as: "subject" } },
      { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },
      { $project: { subjectName: "$subject.name", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),
    ExamAttempt.aggregate([
      { $group: { _id: "$examConfigId", avgScore: { $avg: { $divide: ["$correct", "$total"] } }, attempts: { $sum: 1 } } },
      { $lookup: { from: "examconfigs", localField: "_id", foreignField: "_id", as: "exam" } },
      { $unwind: { path: "$exam", preserveNullAndEmptyArrays: true } },
      { $project: { examTitle: "$exam.title", avgScore: 1, attempts: 1, _id: 0 } },
    ]),
  ]);

  return { usersByRole, subjectPopularity, examAvgScores };
};
