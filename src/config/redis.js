import IORedis from "ioredis";
import env from "./env.js";

const MAX_RETRY_ATTEMPTS = 20; // ~roughly the first couple of minutes, then stop spamming reconnect attempts
const LOG_THROTTLE_MS = 5 * 60 * 1000; // after giving up, only re-log this rarely, not on every failed command

/**
 * Single shared ioredis connection, configured per BullMQ's requirements
 * (maxRetriesPerRequest: null is REQUIRED for BullMQ's blocking commands).
 * lazyConnect defers the actual connection attempt until first use, so
 * booting the app/importing this module never throws just because Redis
 * isn't running yet — failures surface at the call site instead, where
 * jobs/queues.js can fall back gracefully.
 *
 * retryStrategy is intentionally BOUNDED: if Redis is simply not
 * configured for this deployment (e.g. no REDIS_URL set on a host that
 * doesn't have Redis at all), retrying forever every couple of seconds
 * just spams the logs indefinitely. After MAX_RETRY_ATTEMPTS, ioredis is
 * told to stop trying (returning null from retryStrategy) — the app keeps
 * working fine via the inline job fallback either way (see
 * jobs/queues.js). If Redis is added later, restart the process to reconnect.
 */
export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > MAX_RETRY_ATTEMPTS) {
      console.warn(
        `[redis] Giving up after ${MAX_RETRY_ATTEMPTS} failed connection attempts to ${env.REDIS_URL}. ` +
          `Background jobs will keep running inline instead. Restart the process after Redis is reachable.`,
      );
      return null; // tells ioredis to stop retrying
    }
    return Math.min(times * 200, 2000);
  },
});

let lastLoggedAt = 0;
redisConnection.on("error", (err) => {
  // Throttled: without this, a genuinely-down Redis logs one line per
  // retry (every ~1-2s) forever, drowning out real application logs.
  const now = Date.now();
  if (now - lastLoggedAt > LOG_THROTTLE_MS) {
    console.warn(`[redis] connection issue: ${err.message}`);
    lastLoggedAt = now;
  }
});

let hasLoggedConnected = false;
redisConnection.on("connect", () => {
  if (!hasLoggedConnected) {
    console.log("[redis] connected");
    hasLoggedConnected = true;
  }
});
