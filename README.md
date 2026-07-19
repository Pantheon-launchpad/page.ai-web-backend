# Page.AI Backend API

Backend for the Page.AI learning platform — Node.js + Express + MongoDB,
implementing every domain in `API_CONTRACT.md` (auth, users, dashboard,
subjects/resources, AI Tutor, Chat with Book, flashcards, study planner,
practice mode, CBT & mock exams, mistake book, progress/analytics,
achievements, streaks, learning history, wallet/coins, referrals,
settings/downloads/premium/help, notifications, uploads, search, offline
sync, school multi-tenancy, and the full Admin API), plus a background job
system (BullMQ) and Cloudinary-backed file uploads.

See `AUDIT_REPORT.md` for the original gap analysis against the contract and
the architectural decisions made while completing it.

## Cross-client design (Web / React Native / Electron)

This is a single stateless JSON REST API authenticated via a **Bearer
access token** (never cookies/sessions), so the exact same endpoints work
unmodified from a browser, a React Native app, or an Electron app — nothing
in the codebase branches by client type. See the CORS configuration in
`src/app.js` for how each client is accommodated:

- **Web**: subject to browser CORS — allowed origins are configured via `CORS_ORIGINS`, plus the app's own origin is always allowed (so Swagger UI's "Try it out" works).
- **React Native**: native `fetch` is not subject to browser CORS at all.
- **Electron**: the renderer behaves like a browser (CORS applies if
  `webSecurity`/`contextIsolation` are on) — `file://`/`app://` origins and
  requests with no `Origin` header (the main process) are explicitly allowed.

## Tech stack

- Node.js + Express 5, MongoDB + Mongoose
- JWT (short-lived access token + rotating, hashed, revocable refresh token)
- zod (request validation), bcrypt (password hashing)
- helmet, cors, express-rate-limit, a custom Express-5-safe NoSQL sanitizer
- swagger-ui-express (served at `/docs`)
- **BullMQ + Redis** — background job queues (email, notifications, AI deck
  generation, scheduled maintenance), run by a separate worker process
- **Cloudinary** — direct-to-cloud signed uploads (images/video/pdf/docs)
- **node-cron** — recurring maintenance jobs (streak-lapse sweep, health snapshots)

## Architecture

```
src/
  app.js              Express app: security middleware, route mounting, error handling
  server.js           API entry point: connects Mongo, starts the HTTP server
  config/             env.js (centralized config), db.js, redis.js
  constants/          roles.js, errorCodes.js
  models/              ~44 Mongoose models
  middleware/          auth, role/permission (RBAC), schoolScope (multi-tenancy),
                        validate (zod), audit log, rate limiters, sanitizer,
                        centralized error handler, local upload
  services/            business logic, one file (or folder) per domain
    ai/                 provider-agnostic AI abstraction (local/cloud/gemma seam)
    storage/            provider-agnostic upload storage (cloudinary + local dev fallback)
    admin/              admin-domain services
  controllers/          thin HTTP-layer controllers, call into services
  routes/               one router per domain, mounted under /api/v1
  validators/            zod schemas per domain
  dto/                   response-shaping (never leak password/internal fields)
  docs/swagger.js        OpenAPI document served at /docs
  seed/seed.js            idempotent reference-data seed (incl. a demo school)
  jobs/
    queues.js             BullMQ queue definitions + enqueueOrRun (graceful
                          fallback to inline execution if Redis is down)
    scheduler.js           node-cron recurring maintenance jobs
    worker.js               SEPARATE PROCESS entry point (`npm run worker`)
    processors/             the actual job logic (shared by workers AND the
                            inline fallback, so behavior never diverges)
    workers/                BullMQ Worker wiring per queue
```

Enterprise layering: **routes → middleware → controllers → services → models**.
Controllers stay thin; all business logic lives in services.

## Installation

```bash
npm install
cp .env.example .env      # then edit values — see below for what's required per feature
npm run seed              # reference data + a demo school (code: DEMOSCH1)
npm run dev                # API server (or: npm start)
npm run worker             # OPTIONAL, separate process — background job worker
```

- API base: `http://localhost:5000/api/v1`
- Swagger docs: `http://localhost:5000/docs`
- Health check: `GET /health`

**The API works fully without the worker or Redis running** — see
"Background jobs" below for why.

## Background jobs (BullMQ + Redis)

Four queues: `email`, `notifications`, `ai`, `maintenance`. Run the worker
as its own process, separate from the API, so job processing scales and
fails independently:

```bash
npm run worker
```

What's queued today:
- **email** — welcome email on signup, password-reset email
- **notifications** — achievement earned, streak milestone (3/7/14/30/60/100/365
  days), mission completed — writes a `Notification` doc
- **ai** — flashcard deck generation (the API returns the deck immediately
  in `status: "generating"`; the worker fills in cards and flips it to `"ready"`)
- **maintenance** — daily lapsed-streak sweep (00:05), system-health snapshot (every 5m),
  both scheduled via `node-cron` in `jobs/scheduler.js` and only started
  when the **worker** process boots (never the API process, to avoid double-scheduling
  if you ever run multiple API instances)

**Graceful degradation**: every call site uses `enqueueOrRun(queue, jobName, data, fallbackFn)`
(`src/jobs/queues.js`). If Redis is unreachable, the exact same logic runs
inline in the API process instead of on a worker, with a console warning —
so local development without Redis running still works end-to-end, just
without the "background" part. Set `REQUIRE_REDIS=true` (e.g. in CI/staging)
to make that fallback throw instead of silently degrading.

## File uploads (Cloudinary)

`UPLOAD_PROVIDER=cloudinary` (default) uses a **signed direct-to-cloud
upload**: `POST /uploads/sign` returns a signature + params, and the client
POSTs the file bytes straight to Cloudinary — they never pass through this
API server. `POST /uploads/:fileId/confirm` then calls Cloudinary's Admin
API to verify the asset actually exists and pull its real size/url, instead
of trusting whatever the client claims.

Requires `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
in `.env` (from your Cloudinary dashboard).

`UPLOAD_PROVIDER=local` remains as a no-external-dependency dev fallback
(direct multipart PUT to this server) — see `services/storage/local.provider.js`
for why it can't do the same server-side verification Cloudinary can.

## Offline sync

Two endpoints, `src/services/sync.service.js`:

- **`GET /sync/state?since=<ISO timestamp>`** — returns everything changed
  since that token (reference/catalog data like subjects/resources/missions,
  plus this user's own wallet/streak/settings/progress/notifications/study
  plan), split into `catalog` and `user` so the client can cache the former
  more aggressively. Omit `since` for a full initial sync. The response's
  `syncToken` (the server's current time) is what the client stores and
  sends as `since` next time.
- **`POST /sync/actions`** — replays a batch of actions recorded while
  offline: `{ deviceId, actions: [{ clientActionId, type, payload, occurredAt }] }`.
  Each action routes through the **same service call the live endpoint
  uses** (e.g. `practice_attempt` → the same `practice.service.recordAttempt`
  that `/practice/attempts` calls) — there's no parallel "offline" code path
  to drift out of sync with the online one.

**Idempotency**: every action carries a client-generated `clientActionId`,
persisted in `PendingAction` with a unique `(userId, clientActionId)` index.
Resubmitting the same action (e.g. after a flaky reconnect) is recognized
as a duplicate and not re-applied.

**Conflict resolution**: append-only actions (practice attempts, CBT
submissions, flashcard reviews, mission claims) never conflict — they're
just replayed in order. Mutable per-user documents (`settings_update`,
`study_plan_update`) use last-write-wins **with a staleness check**: if the
server document was updated more recently than the client's offline edit
(`occurredAt`), the action comes back with `status: "conflict"` instead of
silently overwriting a newer server-side change, so the client can decide
whether to discard or re-apply on top of the newer state.

Actions within a batch are applied **sequentially, in submitted order** —
several types (like repeated flashcard reviews of the same card) are
order-sensitive.

## Multi-tenancy (schools)

A `School` model plus `User.schoolId` scope the Admin API for the
`school_admin` role. Enforced by `middleware/schoolScope.middleware.js`,
applied to every `/admin/*` route:

- **`super_admin` / `moderator`**: unscoped, platform-wide visibility (unchanged).
- **`school_admin`**: every listing (`/admin/users`, `/admin/reports`) is
  automatically filtered to their own `schoolId`, and every single-resource
  mutation (`/admin/users/:id/suspend`, `/ban`, `/edit`, `/delete`) is
  rejected with `403 FORBIDDEN` if the target user isn't in their school —
  checked server-side (`assertUserInScope`), never trusting the frontend to
  only show in-scope users.
- A `school_admin` with no `schoolId` assigned is rejected outright on any
  admin route, rather than silently getting global or zero access.

**Joining a school**: `POST /auth/signup` accepts an optional `schoolCode`;
if it resolves to a real `School`, the new user is tagged with that
`schoolId` at creation. A school's own admin self-service endpoints
(`GET/PATCH /admin/schools/me/profile`, `GET /admin/schools/me/students`)
always use the caller's own `schoolId` — never a client-supplied id — so a
`school_admin` can't read or edit another school by guessing its id.
Global school CRUD (`/admin/schools`, `/admin/schools/:id`) is
`super_admin`-only for mutations.

Content (`Resource`) remains platform-wide/unscoped — it isn't modeled as
school-owned in this pass. If per-school content libraries become a real
requirement, that needs its own design pass (a `schoolId` on `Resource`
plus visibility rules), not just reusing this scoping middleware.

## Authentication flow

- `POST /api/v1/auth/signup` / `login` / `google` → `{ accessToken, refreshToken, user }`
- `POST /api/v1/auth/refresh` → exchanges a still-valid refresh token for a new access token
- `POST /api/v1/auth/logout` → revokes a refresh token server-side
- Access tokens are short-lived (15m default); refresh tokens are long-lived
  (30d default), stored **hashed** and per-device in `refresh_tokens`, so a
  single device can be logged out without affecting others.

## Response envelope

- Success: `{ "data": <T>, "message"?: string }`
- Error: `{ "message": string, "code": string, "details"?: unknown }`

## Known gaps / documented TODOs

- **AI provider**: `AI_PROVIDER=local` (deterministic, no external calls) is
  the only implemented provider. Cloud and on-device Gemma/LiteRT-LM are
  documented seams (`services/ai/provider.interface.js`), not stubs
  pretending to work.
- **Payments**: `/premium/upgrade` intentionally refuses to grant Premium
  without a real payment processor integration.
- **School content scoping**: schools scope users/reports, not `Resource`
  content — see "Multi-tenancy" above.
- **Scalability**: dashboard/analytics aggregates still run live on read;
  moving them to Redis-cached reads or a scheduled `platform_stats_daily`
  job (the Redis/BullMQ infra for which now exists) remains a documented
  next step, not done in this pass.
- **No automated test suite.** Recommended next step: `supertest` +
  `mongodb-memory-server`, starting with `auth`, `practice`, and `sync`
  since they exercise the most shared middleware and business logic.
