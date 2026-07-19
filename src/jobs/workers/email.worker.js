import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { emailProcessors } from "../processors/email.processor.js";

export const createEmailWorker = () =>
  new Worker(
    "email",
    async (job) => {
      const handler = emailProcessors[job.name];
      if (!handler) throw new Error(`No email processor for job "${job.name}"`);
      await handler(job.data);
    },
    { connection: redisConnection },
  );
