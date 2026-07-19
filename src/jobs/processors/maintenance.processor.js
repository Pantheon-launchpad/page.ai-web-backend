import Streak from "../../models/Streak.js";
import SystemHealthSnapshot from "../../models/SystemHealthSnapshot.js";
import mongoose from "mongoose";

const todayKey = () => new Date().toISOString().slice(0, 10);
const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Daily sweep: any streak whose lastActiveDay is older than yesterday has
 * lapsed and resets to 0. Run on a schedule (see jobs/scheduler.js) rather
 * than computed lazily per-read, so /streaks reads stay cheap.
 */
export const sweepLapsedStreaks = async () => {
  const today = todayKey();
  const yesterday = yesterdayKey();
  const result = await Streak.updateMany(
    { current: { $gt: 0 }, lastActiveDay: { $nin: [today, yesterday] } },
    { $set: { current: 0 } },
  );
  console.log(`[maintenance] Reset ${result.modifiedCount} lapsed streak(s)`);
};

export const takeSystemHealthSnapshot = async () => {
  const dbState = mongoose.connection.readyState;
  await SystemHealthSnapshot.create({
    services: [
      { name: "database", status: dbState === 1 ? "operational" : "down", latencyMs: 0, uptimePercent: dbState === 1 ? 100 : 0 },
      { name: "api", status: "operational", latencyMs: 0, uptimePercent: 100 },
      { name: "ai_provider", status: "operational", latencyMs: 0, uptimePercent: 100 },
    ],
  });
};

export const maintenanceProcessors = {
  "sweep-lapsed-streaks": sweepLapsedStreaks,
  "system-health-snapshot": takeSystemHealthSnapshot,
};
