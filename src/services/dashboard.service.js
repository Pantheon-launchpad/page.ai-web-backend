import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Streak from "../models/Streak.js";
import ActivityLog from "../models/ActivityLog.js";
import Attempt from "../models/Attempt.js";
import Subject from "../models/Subject.js";
import UserSubjectProgress from "../models/UserSubjectProgress.js";
import StudyPlan from "../models/StudyPlan.js";
import Mastery from "../models/Mastery.js";
import Topic from "../models/Topic.js";

const greetingFor = (name) => {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${part}, ${name.split(" ")[0]}`;
};

/**
 * Single aggregate payload for the whole dashboard screen, per
 * API_CONTRACT.md §3. In production this is the highest-traffic read in the
 * app and a strong Redis-cache-per-user candidate (documented, not
 * implemented in this pass — see TECHNICAL_DOCUMENTATION.md §20).
 */
export const getDashboard = async (userId) => {
  const [user, wallet, streak, recentActivity, inProgressSubjects, weakTopics, studyPlan] =
    await Promise.all([
      User.findById(userId),
      Wallet.findOne({ userId }),
      Streak.findOne({ userId }),
      ActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(8),
      UserSubjectProgress.find({ userId }).sort({ lastStudiedAt: -1 }).limit(1).populate("subjectId"),
      Mastery.find({ userId }).sort({ masteryScore: 1 }).limit(3).populate("topicId"),
      StudyPlan.findOne({ userId }),
    ]);

  const continueLearning = inProgressSubjects[0]
    ? {
        subjectId: inProgressSubjects[0].subjectId?._id,
        subjectName: inProgressSubjects[0].subjectId?.name,
        masteryScore: inProgressSubjects[0].masteryScore,
      }
    : null;

  const aiRecommendation = weakTopics[0]
    ? {
        topicId: weakTopics[0].topicId?._id,
        topicName: weakTopics[0].topicId?.name,
        reason: "Lowest mastery score in your recent activity",
        masteryScore: weakTopics[0].masteryScore,
      }
    : null;

  const totalAttempts = await Attempt.countDocuments({ userId });

  return {
    student: {
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      avatarInitial: user.avatarInitial,
      level: Math.max(1, Math.floor((wallet?.lifetimeCoins || 0) / 500) + 1),
      coins: wallet?.todayCoins || 0,
      streak: streak?.current || 0,
      totalAttempts,
    },
    greeting: greetingFor(user.name),
    continueLearning,
    aiRecommendation,
    recentActivity: recentActivity.map((a) => ({
      id: a._id,
      type: a.type,
      label: a.label,
      createdAt: a.createdAt,
    })),
    upcomingRevision: (studyPlan?.entries || [])
      .filter((e) => !e.done)
      .slice(0, 5)
      .map((e) => ({ id: e._id, day: e.day, topic: e.topic, minutes: e.minutes })),
    quickActions: [
      { key: "practice", label: "Practice Mode", href: "/practice" },
      { key: "cbt", label: "CBT & Mock Exams", href: "/cbt" },
      { key: "ai-tutor", label: "Ask AI Tutor", href: "/ai-tutor" },
      { key: "flashcards", label: "Flashcards", href: "/flashcards" },
    ],
  };
};
