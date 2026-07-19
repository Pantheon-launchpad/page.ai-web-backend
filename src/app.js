import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import swaggerUi from "swagger-ui-express";

import env from "./config/env.js";
import { ERROR_CODES } from "./constants/errorCodes.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.middleware.js";
import { sendSuccess } from "./utils/apiResponse.js";
import { localUpload } from "./middleware/localUpload.middleware.js";
import { sanitizeRequest } from "./middleware/sanitize.middleware.js";
import { swaggerDocument } from "./docs/swagger.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import tutorRoutes from "./routes/tutorRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import plannerRoutes from "./routes/plannerRoutes.js";
import practiceRoutes from "./routes/practiceRoutes.js";
import cbtRoutes from "./routes/cbtRoutes.js";
import mistakeRoutes from "./routes/mistakeRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import achievementRoutes from "./routes/achievementRoutes.js";
import streakRoutes from "./routes/streakRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import downloadsRoutes from "./routes/downloadsRoutes.js";
import premiumRoutes from "./routes/premiumRoutes.js";
import helpRoutes from "./routes/helpRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";

const app = express();

// Render is behind a proxy in production (and most PaaS hosts) — needed for
// correct req.ip in rate limiting / audit logs.
app.set("trust proxy", 1);

/**
 * CROSS-CLIENT SUPPORT (Web / React Native / Electron) — this is a plain
 * stateless JSON REST API authenticated via a Bearer access token (not
 * cookies/sessions), so the exact same endpoints work unmodified from:
 *   - Web (browser fetch/axios, subject to CORS — see allow-list below)
 *   - React Native (native fetch, no browser CORS enforcement at all)
 *   - Electron (renderer fetch behaves like a browser and IS subject to CORS
 *     if webSecurity/contextIsolation are on, hence "app://", "file://",
 *     and no-Origin requests are explicitly allowed below; the main process
 *     making requests directly has no Origin header either)
 * No client-specific branching exists anywhere in this codebase — the
 * contract's client field on User-Agent-style analytics is descriptive only.
 */
const corsOptions = {
  origin(origin, callback) {
    // No Origin header at all => native app / server-to-server / curl /
    // Electron main process — always allow, since CORS is a browser-only
    // protection and none of those callers are a browser tab that needs it.
    if (!origin) return callback(null, true);
    if (env.CORS_ORIGINS.includes(origin) || env.CORS_ORIGINS.includes("*")) {
      return callback(null, true);
    }
    // Electron renderer served from the packaged app has no http(s) origin.
    if (origin.startsWith("file://") || origin.startsWith("app://")) {
      return callback(null, true);
    }
    // Self-origin: Swagger UI is served by this same app at /docs, so its
    // "Try it out" browser requests carry Origin=http://localhost:<PORT>.
    // Always allow that regardless of CORS_ORIGINS, since it's the app
    // calling itself, not a third-party site.
    if (origin === `http://localhost:${env.PORT}` || origin === `https://localhost:${env.PORT}`) {
      return callback(null, true);
    }
    const err = new Error(`Origin ${origin} is not allowed by CORS`);
    err.statusCode = 403;
    err.code = ERROR_CODES.FORBIDDEN;
    return callback(err);
  },
  credentials: false, // Bearer tokens, not cookies — no client needs credentialed CORS
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeRequest);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(apiLimiter);

// Health check — used by uptime monitors and the Admin "system health" panel.
app.get("/health", (req, res) => sendSuccess(res, { data: { status: "ok", env: env.NODE_ENV } }));

// Swagger / OpenAPI docs, kept in sync with the implemented routes.
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Local-dev stand-in for a pre-signed bucket PUT (see services/storage). Not
// mounted under /api/v1 since it mirrors an external storage provider's URL
// shape, not this app's own API surface.
app.put(
  "/uploads/direct/*storageKey",
  localUpload.single("file"),
  (req, res) => sendSuccess(res, { data: { received: true } }),
);
app.use("/uploads", express.static(path.resolve("uploads")));

const v1 = express.Router();
v1.use("/auth", authRoutes);
v1.use("/users", userRoutes);
v1.use("/dashboard", dashboardRoutes);
v1.use("/subjects", subjectRoutes);
v1.use("/resources", resourceRoutes);
v1.use("/ai", aiRoutes);
v1.use("/ai/tutor", tutorRoutes);
v1.use("/chat", chatRoutes);
v1.use("/flashcards", flashcardRoutes);
v1.use("/planner", plannerRoutes);
v1.use("/practice", practiceRoutes);
v1.use("/cbt", cbtRoutes);
v1.use("/mistakes", mistakeRoutes);
v1.use("/progress", progressRoutes);
v1.use("/achievements", achievementRoutes);
v1.use("/streaks", streakRoutes);
v1.use("/history", historyRoutes);
v1.use("/wallet", walletRoutes);
v1.use("/referrals", referralRoutes);
v1.use("/settings", settingsRoutes);
v1.use("/downloads", downloadsRoutes);
v1.use("/premium", premiumRoutes);
v1.use("/help", helpRoutes);
v1.use("/notifications", notificationRoutes);
v1.use("/uploads", uploadRoutes);
v1.use("/search", searchRoutes);
v1.use("/sync", syncRoutes);
v1.use("/admin", adminRoutes);

app.use("/api/v1", v1);
// Backward-compatible alias for the original /api/auth path the existing
// frontend integration may already be pointed at.
app.use("/api/auth", authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
