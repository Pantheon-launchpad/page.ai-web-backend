import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { notificationsProcessors } from "../processors/notifications.processor.js";

export const createNotificationsWorker = () =>
  new Worker(
    "notifications",
    async (job) => {
      const handler = notificationsProcessors[job.name];
      if (!handler) throw new Error(`No notifications processor for job "${job.name}"`);
      await handler(job.data);
    },
    { connection: redisConnection },
  );
