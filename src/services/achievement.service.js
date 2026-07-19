import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import Attempt from "../models/Attempt.js";
import Streak from "../models/Streak.js";
import ExamAttempt from "../models/ExamAttempt.js";
import FlashcardReview from "../models/FlashcardReview.js";
import Referral from "../models/Referral.js";
import { notificationsQueue, enqueueOrRun } from "../jobs/queues.js";
import { createNotification } from "../jobs/processors/notifications.processor.js";

const METRIC_COUNTERS = {
  attempts: (userId) => Attempt.countDocuments({ userId }),
  streak_days: async (userId) => (await Streak.findOne({ userId }))?.longest || 0,
  cbt_submissions: (userId) => ExamAttempt.countDocuments({ userId }),
  flashcards_reviewed: (userId) => FlashcardReview.countDocuments({ userId }),
  referrals: async (userId) => (await Referral.findOne({ userId }))?.totalReferrals || 0,
};

export const listAchievements = async (userId) => {
  const achievements = await Achievement.find();

  return Promise.all(
    achievements.map(async (a) => {
      const progress = (await METRIC_COUNTERS[a.metric]?.(userId)) || 0;
      const earned = progress >= a.goal;

      if (earned) {
        const existing = await UserAchievement.findOne({ userId, achievementId: a._id });
        const isNewlyEarned = !existing?.earned;

        await UserAchievement.updateOne(
          { userId, achievementId: a._id },
          { $set: { progress, earned: true }, $setOnInsert: { earnedAt: new Date() } },
          { upsert: true },
        );

        // Only notify the first time this achievement flips to earned —
        // dispatched through the notifications queue (see jobs/queues.js)
        // so a page load that happens to complete several achievements at
        // once doesn't do N synchronous Notification writes in the request path.
        if (isNewlyEarned) {
          await enqueueOrRun(
            notificationsQueue,
            "create",
            {
              userId,
              title: "Achievement unlocked!",
              body: `You earned "${a.title}" — ${a.description}`,
              type: "achievement",
            },
            createNotification,
          );
        }
      }

      return {
        id: a._id,
        key: a.key,
        title: a.title,
        description: a.description,
        icon: a.icon,
        goal: a.goal,
        progress: Math.min(progress, a.goal),
        earned,
      };
    }),
  );
};
