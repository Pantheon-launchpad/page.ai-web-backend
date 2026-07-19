import Streak from "../models/Streak.js";
import { notificationsQueue, enqueueOrRun } from "../jobs/queues.js";
import { createNotification } from "../jobs/processors/notifications.processor.js";

const todayKey = () => new Date().toISOString().slice(0, 10);
const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const MILESTONES = [3, 7, 14, 30, 60, 100, 365];

/** Called from any "counts as activity" write path (attempts, cbt submits, flashcard reviews). */
export const bumpStreak = async (userId) => {
  let streak = await Streak.findOne({ userId });
  if (!streak) streak = new Streak({ userId });

  const today = todayKey();
  if (streak.lastActiveDay === today) return streak; // already counted today

  if (streak.lastActiveDay === yesterdayKey()) {
    streak.current += 1;
  } else {
    streak.current = 1;
  }
  streak.longest = Math.max(streak.longest, streak.current);
  streak.lastActiveDay = today;
  if (!streak.history.includes(today)) streak.history.push(today);
  await streak.save();

  if (MILESTONES.includes(streak.current)) {
    await enqueueOrRun(
      notificationsQueue,
      "create",
      {
        userId,
        title: `${streak.current}-day streak!`,
        body: `You've studied ${streak.current} days in a row. Keep it going!`,
        type: "streak",
      },
      createNotification,
    );
  }

  return streak;
};

export const getStreak = async (userId) => {
  const streak = await Streak.findOne({ userId });
  return {
    current: streak?.current || 0,
    longest: streak?.longest || 0,
    history: streak?.history || [],
  };
};
