import User from "../../models/User.js";
import Attempt from "../../models/Attempt.js";
import ExamAttempt from "../../models/ExamAttempt.js";
import ActivityLog from "../../models/ActivityLog.js";
import Report from "../../models/Report.js";
import SystemHealthSnapshot from "../../models/SystemHealthSnapshot.js";

export const getAdminDashboard = async () => {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, newUsers30d, totalAttempts, totalExamAttempts, openReports, aiMessages30d, latestHealth] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: since30d } }),
      Attempt.countDocuments(),
      ExamAttempt.countDocuments(),
      Report.countDocuments({ status: "open" }),
      ActivityLog.countDocuments({ type: "chat_message", createdAt: { $gte: since30d } }),
      SystemHealthSnapshot.findOne().sort({ takenAt: -1 }),
    ]);

  const growthTrend = await User.aggregate([
    { $match: { createdAt: { $gte: since30d } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  return {
    stats: { totalUsers, newUsers30d, totalAttempts, totalExamAttempts, openReports, aiMessages30d },
    growthTrend: growthTrend.map((g) => ({ date: g._id, count: g.count })),
    aiUsage: { messages30d: aiMessages30d },
    systemHealth: latestHealth?.services || [],
  };
};
