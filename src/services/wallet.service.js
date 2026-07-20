import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import Mission from "../models/Mission.js";
import UserMissionProgress from "../models/UserMissionProgress.js";
import StoreItem from "../models/StoreItem.js";
import { ApiError } from "../utils/ApiError.js";
import { notificationsQueue, enqueueOrRun } from "../jobs/queues.js";
import { createNotification } from "../jobs/processors/notifications.processor.js";
import { tenantVisibilityFilter } from "../utils/tenantFilter.js";

const todayKey = () => new Date().toISOString().slice(0, 10);

const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) wallet = await Wallet.create({ userId });

  // Reset the "today" counter on day rollover.
  const key = todayKey();
  if (wallet.lastCoinDay !== key) {
    wallet.todayCoins = 0;
    wallet.lastCoinDay = key;
    await wallet.save();
  }
  return wallet;
};

/** Server-authoritative coin award. Never trust a client-sent coin amount. */
export const awardCoins = async (userId, amount, label, category = "general") => {
  const wallet = await getOrCreateWallet(userId);
  wallet.todayCoins += amount;
  wallet.lifetimeCoins += amount;
  wallet.storeCredit += amount;
  await wallet.save();

  await WalletTransaction.create({ userId, label, type: "earned", category, coins: amount });
  await bumpMissionProgress(userId, category);
  return wallet;
};

const bumpMissionProgress = async (userId, category) => {
  const metricMap = { practice: "attempts", cbt: "cbt_submissions", flashcards: "flashcards_reviewed" };
  const metric = metricMap[category];
  if (!metric) return;

  const missions = await Mission.find({ metric, active: true });
  const day = todayKey();
  for (const mission of missions) {
    const updated = await UserMissionProgress.findOneAndUpdate(
      { userId, missionId: mission._id, day },
      { $inc: { progress: 1 }, $setOnInsert: { userId, missionId: mission._id, day } },
      { upsert: true, new: true },
    );

    // Fire exactly once, the update that pushes progress from goal-1 to goal.
    if (updated.progress === mission.goal) {
      await enqueueOrRun(
        notificationsQueue,
        "create",
        {
          userId,
          title: "Mission complete!",
          body: `"${mission.label}" is done — claim your ${mission.reward} coins in the Wallet tab.`,
          type: "mission",
        },
        createNotification,
      );
    }
  }
};

export const getWalletSummary = async (userId) => {
  const wallet = await getOrCreateWallet(userId);
  return {
    todayCoins: wallet.todayCoins,
    lifetimeCoins: wallet.lifetimeCoins,
    pendingSync: wallet.pendingSync,
    storeCredit: wallet.storeCredit,
  };
};

export const getMissions = async (userId) => {
  const day = todayKey();
  const [missions, progressDocs] = await Promise.all([
    Mission.find({ active: true }),
    UserMissionProgress.find({ userId, day }),
  ]);
  const progressByMission = new Map(progressDocs.map((p) => [p.missionId.toString(), p]));

  return missions.map((m) => {
    const p = progressByMission.get(m._id.toString());
    return {
      id: m._id,
      key: m.key,
      label: m.label,
      description: m.description,
      icon: m.icon,
      reward: m.reward,
      goal: m.goal,
      progress: Math.min(p?.progress || 0, m.goal),
      claimed: p?.claimed || false,
      completed: (p?.progress || 0) >= m.goal,
    };
  });
};

export const claimMission = async (userId, missionId) => {
  const day = todayKey();
  const mission = await Mission.findById(missionId);
  if (!mission) throw ApiError.notFound("Mission not found");

  const progress = await UserMissionProgress.findOne({ userId, missionId, day });
  if (!progress || progress.progress < mission.goal) {
    throw ApiError.badRequest("Mission is not yet complete");
  }
  if (progress.claimed) throw ApiError.conflict("Mission reward already claimed");

  progress.claimed = true;
  progress.claimedAt = new Date();
  await progress.save();

  await awardCoins(userId, mission.reward, `Mission reward: ${mission.label}`, "mission");
  return { claimed: true, reward: mission.reward };
};

export const getRecentRewards = async (userId) => {
  const WalletTransactionModel = WalletTransaction;
  const txns = await WalletTransactionModel.find({ userId, type: "earned" })
    .sort({ createdAt: -1 })
    .limit(10);
  return txns.map((t) => ({ id: t._id, label: t.label, coins: t.coins, createdAt: t.createdAt }));
};

export const getStoreItems = async (user) => {
  const items = await StoreItem.find(tenantVisibilityFilter(user));
  return items.map((i) => ({
    id: i._id,
    title: i.title,
    description: i.description,
    icon: i.icon,
    cost: i.cost,
    kind: i.kind,
    comingSoon: i.comingSoon,
  }));
};

/**
 * Redemption is server-authoritative: re-checks balance against the DB, never
 * the client's cached wallet state (API_CONTRACT.md §17 / TECHNICAL_DOCUMENTATION.md §19).
 * Every redemption resolves to in-app value only — never cash/airtime/data.
 */
export const redeemItem = async (userId, itemId, requesterSchoolId) => {
  const item = await StoreItem.findById(itemId);
  if (!item) throw ApiError.notFound("Store item not found");
  if (item.comingSoon) throw ApiError.badRequest("This item is not yet available for redemption");
  if (item.schoolId && item.schoolId.toString() !== requesterSchoolId?.toString()) {
    throw ApiError.forbidden("This item is exclusive to another school");
  }

  const wallet = await getOrCreateWallet(userId);
  if (wallet.storeCredit < item.cost) throw ApiError.badRequest("Insufficient store credit");

  wallet.storeCredit -= item.cost;
  await wallet.save();

  await WalletTransaction.create({
    userId,
    label: `Redeemed: ${item.title}`,
    type: "spent",
    category: "store",
    coins: item.cost,
  });

  return { redeemed: true, item: { id: item._id, title: item.title, kind: item.kind }, remainingCredit: wallet.storeCredit };
};

export const getBreakdown = async (userId) => {
  const rows = await WalletTransaction.aggregate([
    { $match: { userId, type: "earned" } },
    { $group: { _id: "$category", total: { $sum: "$coins" } } },
    { $sort: { total: -1 } },
  ]);
  return rows.map((r) => ({ category: r._id, coins: r.total }));
};

export const getTransactions = async (userId, { page = 1, pageSize = 20 } = {}) => {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    WalletTransaction.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    WalletTransaction.countDocuments({ userId }),
  ]);
  return {
    items: items.map((t) => ({ id: t._id, label: t.label, type: t.type, coins: t.coins, createdAt: t.createdAt })),
    page,
    pageSize,
    total,
  };
};
