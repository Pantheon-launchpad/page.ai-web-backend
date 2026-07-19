import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { aiProcessors } from "../processors/ai.processor.js";

export const createAiWorker = () =>
  new Worker(
    "ai",
    async (job) => {
      const handler = aiProcessors[job.name];
      if (!handler) throw new Error(`No ai processor for job "${job.name}"`);
      await handler(job.data);
    },
    { connection: redisConnection, concurrency: 3 },
  );
