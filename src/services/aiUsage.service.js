import ActivityLog from "../models/ActivityLog.js";
import env from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Per-user daily cap on AI usage (contract §6: "50/day on free tier — ties
 * into premium.api.ts plan limits"). Uses ActivityLog as the source of
 * truth rather than a separate counter collection, avoiding write
 * contention on a single hot document.
 */
export const assertWithinDailyLimit = async (userId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await ActivityLog.countDocuments({
    userId,
    type: "chat_message",
    createdAt: { $gte: startOfDay },
  });

  if (count >= env.AI_DAILY_MESSAGE_LIMIT_FREE) {
    throw new ApiError(
      429,
      "Daily AI message limit reached. Upgrade to Premium for a higher limit.",
      "RATE_LIMITED",
    );
  }
};

export const recordUsage = (userId, label) =>
  ActivityLog.create({ userId, type: "chat_message", label });
