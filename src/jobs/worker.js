/**
 * Worker process entry point. Run this as a SEPARATE process from the API
 * (`npm run worker`, alongside `npm run dev`/`npm start`) so job processing
 * (email, notifications, AI deck generation, maintenance) can scale and
 * fail independently of the request/response path. Requires Redis
 * (REDIS_URL) — if Redis isn't running, the API still works fine on its
 * own via the inline-fallback in jobs/queues.js, this process just has
 * nothing to do.
 */
import connectDB from "../config/db.js";
import { createEmailWorker } from "./workers/email.worker.js";
import { createNotificationsWorker } from "./workers/notifications.worker.js";
import { createAiWorker } from "./workers/ai.worker.js";
import { createMaintenanceWorker } from "./workers/maintenance.worker.js";
import { startScheduler } from "./scheduler.js";

const boot = async () => {
  await connectDB(); // workers touch the DB (e.g. creating Notification docs), so they need it too

  const workers = [
    createEmailWorker(),
    createNotificationsWorker(),
    createAiWorker(),
    createMaintenanceWorker(),
  ];

  for (const worker of workers) {
    worker.on("failed", (job, err) => {
      console.error(`[worker:${worker.name}] job "${job?.name}" failed:`, err.message);
    });
  }

  startScheduler();

  console.log("Page.AI background worker running. Queues: email, notifications, ai, maintenance");

  const shutdown = async () => {
    console.log("[worker] shutting down...");
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

boot().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
