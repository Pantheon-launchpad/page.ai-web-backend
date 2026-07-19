# Page.AI Backend — Audit Report (Pre-Implementation)

## 1. Current State of the Repository (`v1.zip`)

### Folder structure
```
.
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── src/
    ├── app.js
    ├── config/db.js
    ├── controllers/authController.js
    ├── middleware/rateLimiter.js
    ├── models/User.js
    ├── routes/authRoutes.js
    ├── server.js
    └── utils/generateToken.js
```

### Inventory
| Layer | Present | Notes |
|---|---|---|
| Routes | `authRoutes.js` only | `/api/auth/register`, `/api/auth/login` |
| Controllers | `authController.js` only | `register`, `login` |
| Services | none | all logic lives directly in the controller |
| Repositories | none | Mongoose models are queried directly from controllers |
| Middleware | `rateLimiter.js` only | 10 req / 15 min on auth routes. No JWT-verify middleware, no role guard, no validation middleware, no audit middleware, no centralized error handler |
| Models | `User.js` only | `fullName`, `email`, `password` (hashed, `select:false`), `avatar`, `role` (`user/admin/teacher/school` — does **not** match contract's roles), `isVerified`, `authProvider`, `providerId` |
| Utilities | `generateToken.js` | Signs a single long-lived (7 day) JWT. No refresh token, no rotation |
| Configuration | `config/db.js` | Mongoose connect only. No centralized `env.js`, no config validation |
| Auth flow | Partial | Register + login only. No refresh, no logout, no Google auth, no forgot/reset password, no email verification, no session endpoint |
| Validation | Inline, ad-hoc | Manual `if (!x)` checks in the controller; no schema validation library |
| Env vars | `PORT`, `MONGO_URI`, `JWT_SECRET` | Missing everything needed for refresh tokens, Google OAuth, mail, uploads, CORS origin, rate-limit tuning |
| Database models | 1 of ~38 collections in the contract's Appendix | See gap list below |
| APIs | 2 of ~90+ endpoints in the contract | ~2% coverage |
| Security | `helmet`, `cors` (open, no origin allow-list), `express-rate-limit` on auth only, bcrypt hashing (cost 10) | No global rate limiting, no `Authorization` verification middleware exists at all yet (nothing in the app currently requires a token), no input sanitization middleware, no audit logging |

### Response-shape mismatch (important)
The existing `authController` returns `{ success, message, token, user }`. The API Contract mandates:
- Success: `{ data: T, message?: string }`
- Error: `{ message: string, code: string, details?: unknown }`

This is a **breaking mismatch** with the contract the frontend's `apiClient`/`ApiError` expect. Per the contract being the authoritative spec for endpoints, the response envelope is standardized across the whole backend during this pass (see Architectural Decisions below). The existing validation logic, bcrypt flow, and `authProvider`-aware login guard inside `authController` are preserved and reused — only the envelope and surrounding architecture (routes → controller → service → repository, refresh tokens, etc.) change.

---

## 2. Gap Analysis vs. `API_CONTRACT.md`

| Domain (contract §) | Status |
|---|---|
| 1. Auth | Partially built (register/login only) → **extended**: signup(rename)/login/google/refresh/logout/forgot-password/session |
| 2. Users | Missing → built |
| 3. Dashboard | Missing → built (aggregate) |
| 4. Subjects | Missing → built |
| 5. Resources | Missing → built |
| 6. AI Tutor | Missing → built (abstraction-backed) |
| 7. Chat with Book | Missing → built |
| 8. Flashcards | Missing → built |
| 9. Study Planner | Missing → built |
| 10. Practice Mode | Missing → built |
| 11. CBT & Mock Exams | Missing → built (real scoring + coin credit) |
| 12. Mistake Book | Missing → built |
| 13. Progress & Analytics | Missing → built (aggregation pipelines) |
| 14. Achievements | Missing → built |
| 15. Streaks | Missing → built |
| 16. Learning History | Missing → built |
| 17. Wallet / Page Coins | Missing → built (server-authoritative balance checks) |
| 18. Referrals | Missing → built |
| 19. Settings/Downloads/Premium/Help | Missing → built |
| 20. Notifications | Missing → built |
| 21. Uploads | Missing → built (signed-URL pattern, storage-provider abstraction) |
| 22. Search | Missing → built (regex-based v1, documented upgrade path) |
| 23. AI Abstraction | Missing → built (`AiProvider` interface; local/mock + cloud slots; on-device Gemma explicitly not implementable server-side, documented) |
| 24. Admin API | Missing → built (RBAC, audit logging on every mutation) |

**Missing middleware (all built in this pass):** JWT auth, role/permission guard, request validation (zod), audit logging, centralized error handler, security headers hardening, per-domain rate limiters.

**Missing models:** 37 of the 38 appendix collections, plus `RefreshToken` and `UserSubjectProgress`/`UserMissionProgress` (implied by the contract's prose but not in the appendix table).

**Technical debt in the existing code:** no service/repository separation (fixed by introducing `services/`), no centralized error handling (fixed), single non-rotating 7-day JWT with no revocation path (fixed with access+refresh pair), open CORS (fixed — origin allow-list via env), role enum doesn't match contract's roles (fixed, see Architectural Decisions).

**Scalability concerns flagged for later (documented, not solved in this pass, per contract's own recommendations):** dashboard aggregate should move to Redis-cached per-user in production; `attempts`/`activity_log` need index + eventual archival strategy (indexes added now, archival job left as a documented TODO); admin analytics should move to a scheduled `platform_stats_daily` job rather than live aggregation (live aggregation implemented now, job structure documented).

---

## 3. Architectural Decisions (flagged per the instructions before major changes)

1. **Response envelope standardized to the contract's `{ data, message }` / `{ message, code, details }` shape**, replacing the existing ad-hoc `{ success, message, ... }` shape. Necessary because the frontend's `ApiError`/interceptor logic parses specifically for `code` and `data`. This is the one breaking change to existing behavior; everything else in `authController`'s logic (validation, bcrypt, provider-aware login guard) is preserved and moved into a service.
2. **`User.role` enum changed** from `["user","admin","teacher","school"]` to the contract's `["student","teacher","moderator","school_admin","super_admin"]`, with `student` as the new default (was `user`). Required for the RBAC the Admin API depends on. A `legacyRole` migration note is left in the model comment for any already-seeded data.
3. **Introduced access + refresh token pair** (short-lived access JWT + rotating, hashed, DB-tracked refresh token) instead of the single 7-day token, to satisfy `/auth/refresh` and `/auth/logout` (server-side invalidation) from the contract. Old `generateToken.js` behavior is preserved as the access-token generator.
4. **Service/Repository layering introduced** (`services/*`, thin `controllers/*`) — additive, does not remove the existing controller pattern, just gives it a business-logic layer to call into, per the "enterprise architecture" instruction.
5. **AI endpoints implemented as a provider-agnostic abstraction** (`services/ai/`) with a `local`/`mock` provider active by default and a documented seam for an on-device Gemma/LiteRT-LM bridge or a cloud provider, per the contract's explicit note that `/ai/remediate` may not be a conventional Express-to-cloud-LLM call.

Everything below implements the above.

---

## Addendum — Second Pass (Offline Sync, Multi-Tenancy, Background Jobs, Cloudinary)

Following the initial completion pass, four additional subsystems were added
on request. None of these were in the original `API_CONTRACT.md`'s
endpoint list, so they're documented here rather than silently folded into
the "gap analysis" above.

1. **Offline sync restored** (`/sync/state`, `/sync/actions`,
   `PendingAction` model). Re-added because the original project brief
   (before `API_CONTRACT.md` was generated) explicitly called for offline
   support, sync tokens, pending actions, and conflict resolution, and the
   contract itself didn't define endpoints for it. Design: idempotent
   action replay keyed by a client-generated `clientActionId`, routed
   through the *same* service functions the live endpoints use (no parallel
   offline code path), with staleness-based conflict detection for mutable
   documents (settings, study plan) and pure replay-in-order for append-only
   actions (attempts, submissions, reviews, claims). See README "Offline sync".

2. **School multi-tenancy** (`School` model, `User.schoolId`,
   `middleware/schoolScope.middleware.js`). Scopes the `school_admin` role
   to their own school across the Admin API's user/report listings and
   mutations, enforced server-side via `assertUserInScope` rather than
   trusting the frontend to filter. `super_admin`/`moderator` remain
   unscoped. Content (`Resource`) was deliberately left unscoped — it isn't
   modeled as school-owned, and retrofitting per-school content visibility
   needs its own design pass rather than reusing this middleware blindly.

3. **Background jobs (BullMQ + Redis)** (`src/jobs/`). Four queues (email,
   notifications, ai, maintenance) processed by a **separate worker
   process** (`npm run worker`), not the API process — so job processing
   scales/fails independently. Every enqueue call goes through
   `enqueueOrRun(queue, jobName, data, fallbackFn)`, which runs the exact
   same logic inline if Redis is unreachable (with a console warning)
   rather than crashing the request — a deliberate resilience choice so the
   API doesn't hard-depend on Redis being up, while still getting the
   scaling benefit when it is. `node-cron` handles the two recurring
   maintenance jobs (streak-lapse sweep, health snapshots), started only by
   the worker process to avoid double-scheduling under horizontal API scaling.

4. **Cloudinary uploads** (`services/storage/cloudinary.provider.js`).
   Replaces the "trust the client" local-only upload flow as the default
   (`UPLOAD_PROVIDER=cloudinary`) with a real signed direct-to-cloud upload:
   file bytes go straight from the client to Cloudinary, never through this
   server, and `confirmUpload` verifies the asset actually exists (and
   pulls its real size/format) via Cloudinary's Admin API rather than
   trusting client-reported metadata. `UPLOAD_PROVIDER=local` remains as a
   dependency-free dev fallback, documented as unable to do the same
   server-side verification.

All four required either a new dependency (`bullmq`, `ioredis`, `cloudinary`,
`node-cron`) or a data-model addition (`School`, `PendingAction`,
`schoolId` on `User`) — none touch or break the endpoints/response shapes
already covering `API_CONTRACT.md`.
