import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Streak from "../models/Streak.js";
import UserSettings from "../models/UserSettings.js";
import RefreshToken from "../models/RefreshToken.js";
import { ApiError } from "../utils/ApiError.js";
import { toUserDto } from "../dto/userDto.js";

// Today's minutes are derived from ActivityLog in a real implementation; kept
// as a lightweight placeholder here since no "session duration" event exists
// yet in the contract's write paths — documented so it's easy to wire up
// once such an event is added.
export const getMe = async (userId) => {
  const [user, wallet, streak, settings] = await Promise.all([
    User.findById(userId),
    Wallet.findOne({ userId }),
    Streak.findOne({ userId }),
    UserSettings.findOne({ userId }),
  ]);
  if (!user) throw ApiError.notFound("User not found");

  return {
    ...toUserDto(user),
    level: Math.max(1, Math.floor((wallet?.lifetimeCoins || 0) / 500) + 1),
    coins: wallet?.todayCoins || 0,
    streak: streak?.current || 0,
    studyMinutesToday: 0,
    studyGoalMinutes: settings?.study?.dailyGoalMinutes || 60,
  };
};

export const updateMe = async (userId, updates) => {
  if (updates.email) {
    const existing = await User.findOne({ email: updates.email.toLowerCase(), _id: { $ne: userId } });
    if (existing) throw ApiError.conflict("Email already in use");
    updates.email = updates.email.toLowerCase();
    // In production, changing email should flip isVerified=false and re-trigger
    // email verification — flagged per API_CONTRACT.md §2.
    updates.isVerified = false;
  }

  const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound("User not found");
  return toUserDto(user);
};

export const deleteMe = async (userId) => {
  await Promise.all([
    User.findByIdAndDelete(userId),
    RefreshToken.deleteMany({ userId }),
  ]);
};
