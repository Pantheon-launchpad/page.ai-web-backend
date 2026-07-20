import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import env from "../config/env.js";

/**
 * One queue per concern, matching the workers in jobs/workers/*.
 * - email:          password reset / transactional email delivery
 * - notifications:  writes Notification docs for achievements/streaks/missions
 * - ai:              slower AI work (flashcard deck generation) that shouldn't
 *                    block the request/response cycle
 * - maintenance:     one-off enqueued maintenance tasks (repeatable/cron-style
 *                    maintenance itself is scheduled with node-cron in
 *                    jobs/scheduler.js, not through this queue)
 */
export const emailQueue = new Queue("email", { connection: redisConnection });
export const notificationsQueue = new Queue("notifications", { connection: redisConnection });
export const aiQueue = new Queue("ai", { connection: redisConnection });
export const maintenanceQueue = new Queue("maintenance", { connection: redisConnection });

/**
 * BullMQ's Queue class emits its OWN 'error' events (distinct from the raw
 * ioredis connection's 'error' event already handled in config/redis.js) —
 * e.g. when it can't reach Redis to check queue metadata. Without a
 * listener attached, Node treats those as unhandled and prints a raw stack
 * trace per occurrence instead of one clean warning. This is a well-known
 * BullMQ requirement (every Queue/Worker/QueueEvents needs its own 'error'
 * listener), not optional cleanup.
 */
const allQueues = [emailQueue, notificationsQueue, aiQueue, maintenanceQueue];
const loggedQueueErrorAt = {};
for (const queue of allQueues) {
  queue.on("error", (err) => {
    const now = Date.now();
    const lastLogged = loggedQueueErrorAt[queue.name] || 0;
    if (now - lastLogged > 5 * 60 * 1000) {
      console.warn(`[jobs] queue "${queue.name}" error: ${err.message}`);
      loggedQueueErrorAt[queue.name] = now;
    }
  });
}

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 500 },
};

/**
 * Enqueues a job; if Redis is unreachable, either throws (REQUIRE_REDIS=true,
 * e.g. CI/staging where silent fallback would hide a real infra problem) or
 * runs `fallbackFn` inline in-process (local dev without Redis running —
 * keeps the app fully functional, just without the "background" part).
 * Every call site provides a fallbackFn that does the same work directly,
 * so behavior is identical either way from the caller's perspective.
 */
export const enqueueOrRun = async (queue, jobName, data, fallbackFn) => {
  try {
    await queue.add(jobName, data, defaultJobOptions);
  } catch (err) {
    if (env.REQUIRE_REDIS) throw err;
    console.warn(`[jobs] Redis unavailable, running "${jobName}" inline: ${err.message}`);
    await fallbackFn(data);
  }
};
