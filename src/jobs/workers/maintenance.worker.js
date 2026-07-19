import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { maintenanceProcessors } from "../processors/maintenance.processor.js";

export const createMaintenanceWorker = () =>
  new Worker(
    "maintenance",
    async (job) => {
      const handler = maintenanceProcessors[job.name];
      if (!handler) throw new Error(`No maintenance processor for job "${job.name}"`);
      await handler(job.data);
    },
    { connection: redisConnection },
  );
