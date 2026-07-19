import IORedis from "ioredis";
import env from "./env.js";

/**
 * Single shared ioredis connection, configured per BullMQ's requirements
 * (maxRetriesPerRequest: null, enableReadyCheck: false is NOT required but
 * maxRetriesPerRequest MUST be null for blocking commands BullMQ uses).
 * lazyConnect defers the actual connection attempt until first use, so
 * booting the app/importing this module never throws just because Redis
 * isn't running yet — failures surface at the call site instead, where
 * jobs/queues.js can fall back gracefully.
 */
export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redisConnection.on("error", (err) => {
  // Logged once per connection attempt failure, not per queued job — avoids
  // log-spamming when Redis is intentionally not running in local dev.
  console.warn(`[redis] connection issue: ${err.message}`);
});

let hasLoggedConnected = false;
redisConnection.on("connect", () => {
  if (!hasLoggedConnected) {
    console.log("[redis] connected");
    hasLoggedConnected = true;
  }
});
