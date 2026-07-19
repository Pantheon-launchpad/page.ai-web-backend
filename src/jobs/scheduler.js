import cron from "node-cron";
import { maintenanceQueue, enqueueOrRun } from "./queues.js";
import { sweepLapsedStreaks, takeSystemHealthSnapshot } from "./processors/maintenance.processor.js";

/**
 * Recurring maintenance, scheduled with node-cron (simple, no separate
 * "repeatable job" bookkeeping to reason about) but still dispatched
 * through the same maintenanceQueue/enqueueOrRun path as everything else,
 * so it still runs on a worker process when Redis is available instead of
 * blocking whichever process happens to have the cron timer.
 *
 * Only call startScheduler() from the worker process (see jobs/worker.js),
 * never from the API process — otherwise a horizontally-scaled API would
 * schedule the same job N times.
 */
export const startScheduler = () => {
  // Once daily at 00:05 — after midnight so "yesterday" comparisons in the
  // streak sweep are unambiguous.
  cron.schedule("5 0 * * *", () => {
    enqueueOrRun(maintenanceQueue, "sweep-lapsed-streaks", {}, sweepLapsedStreaks).catch((err) =>
      console.error("[scheduler] sweep-lapsed-streaks failed:", err),
    );
  });

  // Every 5 minutes — cheap, and feeds the admin system-health trend.
  cron.schedule("*/5 * * * *", () => {
    enqueueOrRun(maintenanceQueue, "system-health-snapshot", {}, takeSystemHealthSnapshot).catch((err) =>
      console.error("[scheduler] system-health-snapshot failed:", err),
    );
  });

  console.log("[scheduler] Maintenance cron jobs scheduled (streak sweep daily, health snapshot every 5m)");
};
