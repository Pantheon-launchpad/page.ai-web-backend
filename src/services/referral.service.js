import Referral from "../models/Referral.js";
import ReferralMilestone from "../models/ReferralMilestone.js";
import { ApiError } from "../utils/ApiError.js";

export const getMyReferral = async (userId) => {
  let referral = await Referral.findOne({ userId });
  if (!referral) referral = await Referral.create({ userId });
  return {
    code: referral.code,
    link: referral.link || `https://page.ai/join?ref=${referral.code}`,
    totalReferrals: referral.totalReferrals,
    activeReferrals: referral.activeReferrals,
    coinsEarned: referral.coinsEarned,
    monthlyGoal: referral.monthlyGoal,
    monthlyProgress: referral.monthlyProgress,
  };
};

export const getRecentReferred = async (userId) => {
  const milestones = await ReferralMilestone.find({ userId }).sort({ createdAt: -1 }).limit(10).populate("referredUserId", "name avatar");
  return milestones.map((m) => ({
    id: m._id,
    name: m.referredUserId?.name,
    avatar: m.referredUserId?.avatar,
    reward: m.reward,
    achieved: m.achieved,
    createdAt: m.createdAt,
  }));
};

// Public — applied during signup (also invoked directly by signup service);
// exposed separately per API_CONTRACT.md §18 for the standalone /referrals/apply call.
export const applyCode = async (newUserId, code) => {
  const referrer = await Referral.findOne({ code: code.toUpperCase() });
  if (!referrer) throw ApiError.notFound("Invalid referral code");
  if (referrer.userId.toString() === newUserId.toString()) {
    throw ApiError.badRequest("You cannot refer yourself");
  }

  referrer.totalReferrals += 1;
  referrer.activeReferrals += 1;
  referrer.monthlyProgress += 1;
  await referrer.save();

  return { applied: true };
};
