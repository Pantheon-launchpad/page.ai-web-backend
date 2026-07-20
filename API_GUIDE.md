# Page.AI API Guide

A practical reference for consuming the Page.AI backend from any client —
Web, React Native, or Electron. This document complements the interactive
Swagger UI (`GET /docs`) with concrete request/response examples and the
conventions that apply across every endpoint.

---
## Table of contents

1. [Getting started](#1-getting-started) — base URL, auth, response envelope, errors, pagination, rate limits, multi-tenancy, cross-client notes
2. [Auth](#2-auth)
3. [Users](#3-users)
4. [Dashboard](#4-dashboard)
5. [Subjects](#5-subjects)
6. [Resources](#6-resources)
7. [AI](#7-ai)
8. [AI Tutor](#8-ai-tutor)
9. [Chat with Book](#9-chat-with-book)
10. [Flashcards](#10-flashcards)
11. [Study Planner](#11-study-planner)
12. [Practice Mode](#12-practice-mode)
13. [CBT & Mock Exams](#13-cbt--mock-exams)
14. [Mistake Book](#14-mistake-book)
15. [Progress & Analytics](#15-progress--analytics)
16. [Achievements](#16-achievements)
17. [Streaks](#17-streaks)
18. [Learning History](#18-learning-history)
19. [Wallet (Page Coins)](#19-wallet-page-coins)
20. [Referrals](#20-referrals)
21. [Settings, Downloads, Premium, Help](#21-settings-downloads-premium-help)
22. [Notifications](#22-notifications)
23. [Uploads (Cloudinary)](#23-uploads-cloudinary)
24. [Search](#24-search)
25. [Offline Sync](#25-offline-sync)
26. [Admin API](#26-admin-api) — including full multi-tenancy (schools) reference
27. [Platform Integration Guides](#27-platform-integration-guides) — Web, React Native, Electron client setup

---



## 1. Getting started

### Base URL

```
http://localhost:5000/api/v1        (local dev)
```

All endpoints below are relative to this base URL unless stated otherwise.

### Authentication

Every protected endpoint expects a Bearer access token:

```
Authorization: Bearer <accessToken>
```

Get a token pair from `POST /auth/signup`, `/auth/login`, or `/auth/google`.
Access tokens expire quickly (15 minutes by default) — use `POST
/auth/refresh` to get a new one without forcing the user to log in again.
See §2 for the full flow.

### Response envelope

Every successful response has this shape:

```json
{
  "data": { /* the actual payload — object, array, or null */ },
  "message": "Optional human-readable message"
}
```

Every error response has this shape:

```json
{
  "message": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": { "optional": "extra context, e.g. field-level validation errors" }
}
```

`code` is one of: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`,
`NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `BAD_REQUEST`,
`ACCOUNT_SUSPENDED`, `ACCOUNT_BANNED`, `INTERNAL_ERROR`.

### Common HTTP status codes

| Status | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (e.g. business-rule violation) |
| 401 | Missing/invalid/expired token |
| 403 | Authenticated, but not allowed to do this |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate email) |
| 422 | Request body/query failed validation |
| 429 | Rate limited |
| 500 | Server error |

### Pagination

List endpoints that support pagination accept `page` (default `1`) and
`pageSize` (default varies, capped at 100) as query params, and return:

```json
{
  "data": {
    "items": [ /* ... */ ],
    "page": 1,
    "pageSize": 20,
    "total": 137
  }
}
```

### Rate limits

- Auth endpoints (`/auth/signup`, `/login`, `/google`, `/forgot-password`): 10 requests / 15 min per IP.
- AI endpoints (`/ai/*`, `/ai/tutor/*`, `/chat/*/message`): 20 requests / min per IP, **plus** a per-user daily cap (50 messages/day on the free tier — see `AI_DAILY_MESSAGE_LIMIT_FREE`).
- Everything else: 120 requests / min per IP.

A rate-limited request returns `429` with `code: "RATE_LIMITED"`.

### Multi-tenancy (schools)

Some content is tenant-scoped: `null` means visible to everyone, a school
id means exclusive to that school's students. This affects what `GET
/resources`, `GET /cbt/papers`, `GET /cbt/mock-exams`, and `GET
/wallet/store` return — a user's own `schoolId` (set at signup via
`schoolCode`, or by joining later) determines whether they see a given
school's exclusive items in addition to platform-wide ones. See §22
(Admin API) for how school admins manage this.

### Cross-client notes

This is a stateless Bearer-token API — no cookies, no server-side
sessions. The exact same requests work from a browser, React Native, or
Electron. The only client-specific consideration is CORS, which only
applies to browser-based clients (Web, Electron renderer) — see the
backend's `README.md` for the allow-list configuration.

---

## 2. Auth

### `POST /auth/signup` — Create an account

**Auth:** none

```json
// Request
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "hunter22",
  "classLevel": "SS3",
  "targetExams": ["WAEC", "JAMB"],
  "focusSubjects": ["Mathematics", "Physics"],
  "referralCode": "JOHN123",     // optional
  "schoolCode": "DEMOSCH1"        // optional — joins a school tenant
}
```

```json
// 201 Response
{
  "data": {
    "user": {
      "id": "665f1...",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "role": "student",
      "schoolId": "665f0...",
      "isVerified": false,
      "authProvider": "local"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "tokenType": "Bearer"
    }
  },
  "message": "Account created successfully"
}
```

### `POST /auth/login` — Email/password login

**Auth:** none

```json
// Request
{ "email": "ada@example.com", "password": "hunter22" }
```

Response shape is identical to signup's (`{ user, tokens }`).

### `POST /auth/google` — Google sign-in

**Auth:** none. Requires `GOOGLE_CLIENT_ID` configured server-side.

```json
// Request
{ "idToken": "<Google ID token from the client SDK>" }
```

Response shape is identical to signup's.

### `POST /auth/refresh` — Get a new access token

**Auth:** none (the refresh token itself is the credential)

```json
// Request
{ "refreshToken": "eyJhbGciOi..." }
```

```json
// Response
{ "data": { "accessToken": "eyJhbGciOi..." } }
```

**Client pattern:** on any `401` from a protected endpoint, call this
once, retry the original request with the new access token, and if the
refresh itself fails, force a re-login.

### `POST /auth/logout` — Revoke a refresh token

**Auth:** none required, but pass the token to revoke

```json
// Request
{ "refreshToken": "eyJhbGciOi..." }
```

Revokes just that device's refresh token — other logged-in devices are
unaffected.

### `POST /auth/forgot-password` — Request a password reset

**Auth:** none

```json
{ "email": "ada@example.com" }
```

Always returns success regardless of whether the email is registered
(doesn't leak account existence). Sends a reset email via the background
job queue (logged to console in this deployment — no email provider wired
up yet).

### `GET /auth/session` — Get the current session, if any

**Auth:** optional (returns `null` data if not logged in, instead of a 401)

```json
// Response (logged in)
{ "data": { "id": "665f1...", "name": "Ada Lovelace", "...": "..." } }
// Response (not logged in)
{ "data": null }
```

---

## 3. Users

### `GET /users/me` — Get my profile

**Auth:** required

```json
{
  "data": {
    "id": "665f1...",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "level": 3,
    "coins": 120,
    "streak": 5,
    "studyMinutesToday": 0,
    "studyGoalMinutes": 60
  }
}
```

### `PATCH /users/me` — Update my profile

**Auth:** required

```json
// Request (all fields optional)
{ "name": "Ada L.", "classLevel": "SS3", "targetExams": ["WAEC"] }
```

Changing `email` resets `isVerified` to `false`.

### `DELETE /users/me` — Delete my account

**Auth:** required. Irreversible — deletes the user and revokes all refresh tokens.

---

## 4. Dashboard

### `GET /dashboard` — Single aggregate for the home screen

**Auth:** required

```json
{
  "data": {
    "student": { "id": "...", "name": "Ada Lovelace", "level": 3, "coins": 120, "streak": 5, "totalAttempts": 42 },
    "greeting": "Good morning, Ada",
    "continueLearning": { "subjectId": "...", "subjectName": "Mathematics", "masteryScore": 0.62 },
    "aiRecommendation": { "topicId": "...", "topicName": "Trigonometry", "reason": "Lowest mastery score in your recent activity", "masteryScore": 0.31 },
    "recentActivity": [ { "id": "...", "type": "practice_attempt", "label": "Practice attempt", "createdAt": "..." } ],
    "upcomingRevision": [ { "id": "...", "day": "Mon", "topic": "Quadratic Equations", "minutes": 30 } ],
    "quickActions": [ { "key": "practice", "label": "Practice Mode", "href": "/practice" } ]
  }
}
```

One call, no client-side stitching required.
## 5. Subjects

### `GET /subjects` — List subjects with my progress

**Auth:** required

```json
{
  "data": [
    { "id": "...", "name": "Mathematics", "icon": "calculator", "color": "#6366F1", "masteryScore": 0.62, "questionsAttempted": 34 }
  ]
}
```

### `GET /subjects/:id` — One subject with topics

**Auth:** required

```json
{
  "data": {
    "id": "...", "name": "Mathematics", "masteryScore": 0.62,
    "questionsAttempted": 34, "questionsCorrect": 21,
    "topics": [ { "id": "...", "name": "Quadratic Equations" } ]
  }
}
```

---

## 6. Resources

### `GET /resources` — List/search resources

**Auth:** required
**Query params:** `type` (`video`|`pdf`|`article`|`audio`|`past_question`), `subject` (subject id), `search` (text)

```json
{
  "data": [
    {
      "id": "...", "title": "Intro to Trigonometry", "type": "video",
      "subject": { "_id": "...", "name": "Mathematics", "icon": "calculator", "color": "#6366F1" },
      "url": "https://...", "thumbnail": "https://...", "durationMinutes": 12,
      "bookmarked": false
    }
  ]
}
```

**Tenant scoping:** results include platform-wide resources plus your own
school's exclusive resources (if you belong to one) — see §1.

### `POST /resources/:id/bookmark` — Bookmark/unbookmark

**Auth:** required

```json
// Request
{ "bookmarked": true }
// Response
{ "data": { "bookmarked": true } }
```

---

## 7. AI

The AI surface routes through a provider abstraction. In this deployment
`AI_PROVIDER=local` — responses are deterministic and templated, not from a
real LLM (see `README.md`). The request/response contracts below are stable
regardless of which provider is active.

### `POST /ai/chat` — Single-shot AI chat

**Auth:** required. Counts against your daily AI message limit.

```json
// Request
{ "messages": [ { "role": "user", "content": "Explain photosynthesis simply" } ] }
// Response
{ "data": { "reply": "Here's my take on ...: ..." } }
```

### `POST /ai/chat/stream` — SSE-streamed AI chat

**Auth:** required. Same request body as `/ai/chat`.

Response is `text/event-stream`:
```
data: {"token":"Here's "}

data: {"token":"my "}

...
data: [DONE]
```

Consume with `EventSource` (web) or a streaming-fetch reader (React
Native/Electron don't support `EventSource` natively — read the
`ReadableStream` body directly).

### `POST /ai/remediate` — Explain a wrong answer

**Auth:** required. This is what powers the Mistake Book — you likely
won't call it directly, since `/practice/attempts` calls it internally on
a wrong answer. Documented in case a client wants to re-request an
explanation for something previously answered.

```json
// Request
{
  "subject": "Mathematics", "topic": "Quadratic Equations",
  "questionStem": "What are the roots of x^2 - 5x + 6 = 0?",
  "studentChosenOption": "x = 1, x = 6", "correctOption": "x = 2, x = 3",
  "masteryScore": 0.4
}
// Response
{
  "data": {
    "explanation": "...", "misconceptionSummary": "...", "mnemonic": "...",
    "followUpQuestion": { "stem": "...", "options": ["..."], "correctIndex": 0 },
    "difficultyAdjustment": "same"
  }
}
```

### `POST /ai/mnemonic` — Get a mnemonic for a concept

**Auth:** required. Not rate-limited against the daily AI cap (cheap/short).

```json
{ "concept": "Noble gases", "subject": "Chemistry" }
// -> { "data": { "mnemonic": "..." } }
```

### `POST /ai/vision`, `POST /ai/documents`

**Not implemented** in this deployment — both return `400 BAD_REQUEST`.
Reserved for future image/document AI understanding.

---

## 8. AI Tutor

### `GET /ai/tutor/capabilities` — List capability cards for the Tutor UI

**Auth:** required

```json
{
  "data": {
    "capabilities": [
      { "key": "explain", "title": "Explain a concept", "icon": "book-open", "promptChips": ["Explain photosynthesis simply", "..."] }
    ]
  }
}
```

### `POST /ai/tutor/message` — Send a message to the Tutor

**Auth:** required. Counts against your daily AI message limit.

```json
{ "message": "Help me understand Newton's second law", "conversationId": "optional" }
// -> { "data": { "reply": "..." } }
```

---

## 9. Chat with Book

Upload a document, then have a conversation grounded in it.

### `GET /chat/sources` — List my uploaded chat sources

**Auth:** required

```json
{ "data": [ { "id": "...", "title": "Biology Textbook Ch.3", "kind": "uploaded_doc", "status": "ready" } ] }
```

### `POST /chat/upload` — Register an uploaded file as a chat source

**Auth:** required. **You must upload the file first** via `POST
/uploads/sign` → direct upload to Cloudinary → `POST
/uploads/:fileId/confirm` (see §21), THEN call this with the resulting
`fileId`.

```json
// Request
{ "title": "Biology Textbook Ch.3", "fileId": "665f2..." }
// Response
{ "data": { "id": "...", "title": "Biology Textbook Ch.3", "kind": "uploaded_doc", "status": "ready" } }
```

### `POST /chat/:sourceId/message` — Ask about a source

**Auth:** required. Counts against your daily AI message limit.

```json
{ "message": "Summarize the section on mitosis" }
// -> { "data": { "reply": "..." } }
```
## 10. Flashcards

Spaced repetition using an SM-2-lite scheduler.

### `GET /flashcards/decks` — List my decks

**Auth:** required

```json
{
  "data": [
    { "id": "...", "title": "Trigonometry — AI Deck", "topic": "Trigonometry", "source": "ai_generated", "status": "ready", "dueCount": 4, "totalCount": 10 }
  ]
}
```

`status` is `"generating"` briefly after `POST /flashcards/generate` (see
below) while the background worker fills in card content, then flips to
`"ready"`.

### `POST /flashcards/generate` — AI-generate a new deck

**Auth:** required. Returns immediately — card generation happens in the
background (see `README.md` → Background jobs).

```json
// Request
{ "topic": "Trigonometry", "subjectId": "665f0...", "cardCount": 10 }
// 201 Response
{ "data": { "id": "665f3...", "title": "Trigonometry — AI Deck", "status": "generating", "cardCount": 10 } }
```

### `POST /flashcards/:deckId/cards/:cardId/review` — Review a card

**Auth:** required

```json
// Request
{ "rating": "good" }   // one of: "again" | "hard" | "good" | "easy"
// Response
{ "data": { "nextDueAt": "2026-07-22T10:00:00.000Z" } }
```

---

## 11. Study Planner

### `GET /planner` — My study plan + recommendations

**Auth:** required

```json
{
  "data": {
    "weekOf": "2026-07-13",
    "dailyGoalMinutes": 60,
    "entries": [ { "_id": "...", "day": "Mon", "subjectId": "...", "topic": "Trigonometry", "minutes": 30, "done": false } ],
    "upcomingExams": [ { "id": "...", "examName": "WAEC 2026", "date": "2026-08-01T00:00:00.000Z" } ],
    "recommendations": [ { "topicId": "...", "topicName": "Trigonometry", "masteryScore": 0.31, "reason": "Low mastery — recommended for revision this week" } ]
  }
}
```

---

## 12. Practice Mode

### `GET /practice/subjects` — List subjects (practice-mode framing)

**Auth:** required

```json
{ "data": [ { "id": "...", "name": "Mathematics", "icon": "calculator", "color": "#6366F1" } ] }
```

### `GET /practice/subjects/:subject/topics` — Topics for a subject

**Auth:** required. `:subject` is the subject **name**, e.g. `Mathematics`.

```json
{ "data": [ { "id": "...", "name": "Quadratic Equations" } ] }
```

### `GET /practice/questions` — Get practice questions

**Auth:** required
**Query params:** `subject` (name), `topic` (name), `difficulty` (1-5)

```json
{
  "data": [
    {
      "id": "665f4...", "stem": "What are the roots of x^2 - 5x + 6 = 0?", "difficulty": 2,
      "options": [ { "id": "665f4a...", "label": "A", "text": "x = 2, x = 3" }, { "...": "..." } ]
    }
  ]
}
```

Note: `isCorrect` is **never** included in this response — the answer key
only comes back after you submit an attempt.

### `POST /practice/attempts` — Submit an answer

**Auth:** required. This is the core practice-mode loop: it scores the
answer, updates mastery, bumps your streak, awards coins on a correct
answer, and — on a wrong answer — generates an AI remediation + creates a
Mistake Book entry, all in one call.

```json
// Request
{ "questionId": "665f4...", "chosenIndex": 1 }   // -1 = skipped
// 201 Response
{
  "data": {
    "isCorrect": false,
    "correctOptionId": "665f4a...",
    "masteryScore": 0.42,
    "suggestedDifficultyShift": "easier",   // "harder" | "easier" | "same"
    "mistakeId": "665f5..."                  // present only if wrong
  }
}
```

---

## 13. CBT & Mock Exams

### `GET /cbt/papers` — List past-question papers

**Auth:** required. Tenant-scoped (see §1).

```json
{ "data": [ { "id": "...", "title": "WAEC Mathematics 2024", "subject": "Mathematics", "board": "WAEC", "durationMinutes": 60, "questionCount": 40, "hasCalculator": true } ] }
```

### `GET /cbt/mock-exams` — List mock exams

**Auth:** required. Same shape as papers; `kind: "mock_exam"` internally.

### `GET /cbt/:examId/questions` — Get an exam's questions

**Auth:** required. `403 FORBIDDEN` if the exam belongs to another school.

```json
{ "data": [ { "id": "...", "stem": "...", "options": [ { "id": "...", "label": "A", "text": "..." } ] } ] }
```

### `POST /cbt/:examId/submit` — Submit answers for scoring

**Auth:** required. Server-authoritative scoring — coins are computed
server-side from `%` correct, never trusted from the client. Resubmitting
the same exam within 5 minutes is rejected.

```json
// Request
{
  "answers": { "665f4...": 0, "665f4b...": null },   // questionId -> chosen option index, null = skipped
  "timeTakenSeconds": 1800
}
// Response
{ "data": { "correct": 32, "wrong": 6, "skipped": 2, "total": 40, "coinsEarned": 40, "attemptId": "665f6..." } }
```
## 14. Mistake Book

### `GET /mistakes` — List my mistakes

**Auth:** required. **Query param:** `subject` (subject id, optional)

```json
{
  "data": [
    {
      "id": "...", "subject": { "_id": "...", "name": "Mathematics", "icon": "calculator", "color": "#6366F1" },
      "question": "What are the roots of x^2 - 5x + 6 = 0?",
      "misconceptionSummary": "...", "mnemonic": "...", "resolved": false, "createdAt": "..."
    }
  ]
}
```

Populated automatically whenever `/practice/attempts` scores a wrong
answer — nothing to create here directly.

---

## 15. Progress & Analytics

### `GET /progress/analytics` — Heatmap, trend, and topic breakdowns

**Auth:** required

```json
{
  "data": {
    "heatmap": [ { "_id": "2026-07-18", "count": 12 } ],
    "accuracyTrend": [ { "date": "2026-07-18", "accuracy": 0.75 } ],
    "topicPerformance": [ { "topicId": "...", "topicName": "Trigonometry", "total": 20, "accuracy": 0.6 } ],
    "subjectDistribution": [ { "subjectId": "...", "subjectName": "Mathematics", "count": 34 } ]
  }
}
```

### `GET /progress/weak-areas` — My weakest topics

**Auth:** required

```json
{ "data": [ { "topicId": "...", "topicName": "Trigonometry", "masteryScore": 0.31 } ] }
```

---

## 16. Achievements

### `GET /achievements` — My achievements + progress

**Auth:** required. Achievement progress and "earned" status are computed
live from your actual activity counters each time you call this (not
pre-cached) — always current.

```json
{
  "data": [
    { "id": "...", "key": "streak_7", "title": "Week Warrior", "description": "Maintain a 7-day streak", "icon": "flame", "goal": 7, "progress": 5, "earned": false }
  ]
}
```

The first time an achievement flips to `earned: true`, a notification is
queued automatically (see §20).

---

## 17. Streaks

### `GET /streaks` — My streak

**Auth:** required

```json
{ "data": { "current": 5, "longest": 12, "history": ["2026-07-14", "2026-07-15", "..."] } }
```

Streaks bump automatically from any qualifying activity (practice
attempts, CBT submissions, flashcard reviews) — no direct write endpoint.
Milestone streaks (3/7/14/30/60/100/365 days) trigger a notification.

---

## 18. Learning History

### `GET /history` — Paginated activity feed

**Auth:** required. **Query params:** `page`, `pageSize` (see §1 pagination)

```json
{
  "data": {
    "items": [ { "id": "...", "type": "practice_attempt", "label": "Practice attempt", "createdAt": "..." } ],
    "page": 1, "pageSize": 30, "total": 214
  }
}
```

---

## 19. Wallet (Page Coins)

All coin amounts are **server-authoritative** — never trust or send a
coin amount from the client; every earning/spending path is computed
server-side.

### `GET /wallet` — My wallet summary

**Auth:** required

```json
{ "data": { "todayCoins": 24, "lifetimeCoins": 1180, "pendingSync": 0, "storeCredit": 340 } }
```

### `GET /wallet/missions` — Today's missions

**Auth:** required

```json
{
  "data": [
    { "id": "...", "key": "daily_5_practice", "label": "Answer 5 practice questions", "icon": "target", "reward": 10, "goal": 5, "progress": 5, "claimed": false, "completed": true }
  ]
}
```

### `POST /wallet/missions/:id/claim` — Claim a completed mission's reward

**Auth:** required. `400` if not yet complete, `409` if already claimed.

```json
{ "data": { "claimed": true, "reward": 10 } }
```

### `GET /wallet/rewards/recent` — Recent coin-earning events

**Auth:** required

```json
{ "data": [ { "id": "...", "label": "Correct practice answer", "coins": 2, "createdAt": "..." } ] }
```

### `GET /wallet/store` — Store items available to redeem

**Auth:** required. Tenant-scoped (see §1) — includes platform-wide items
plus your own school's exclusive items, if any.

```json
{ "data": [ { "id": "...", "title": "3 Days Premium", "description": "...", "icon": "star", "cost": 300, "kind": "premium_time", "comingSoon": false } ] }
```

### `POST /wallet/store/:itemId/redeem` — Redeem an item

**Auth:** required. Re-checks your balance against the DB server-side.
`403` if the item is exclusive to another school; `400` if insufficient
credit or the item isn't available yet.

```json
{ "data": { "redeemed": true, "item": { "id": "...", "title": "3 Days Premium", "kind": "premium_time" }, "remainingCredit": 40 } }
```

Redemptions are **in-app value only** — never cash, airtime, or data.

### `GET /wallet/breakdown` — Coins earned by category

**Auth:** required

```json
{ "data": [ { "category": "practice", "coins": 640 }, { "category": "cbt", "coins": 480 } ] }
```

### `GET /wallet/transactions` — Paginated transaction history

**Auth:** required. **Query params:** `page`, `pageSize`

```json
{
  "data": {
    "items": [ { "id": "...", "label": "CBT: WAEC Mathematics Mock 2026", "type": "earned", "coins": 40, "createdAt": "..." } ],
    "page": 1, "pageSize": 20, "total": 88
  }
}
```
## 20. Referrals

### `GET /referrals` — My referral code + stats

**Auth:** required

```json
{ "data": { "code": "ADA7K2QX", "link": "https://page.ai/join?ref=ADA7K2QX", "totalReferrals": 3, "activeReferrals": 3, "coinsEarned": 150, "monthlyGoal": 5, "monthlyProgress": 3 } }
```

### `GET /referrals/recent` — Recently referred users

**Auth:** required

```json
{ "data": [ { "id": "...", "name": "Chidi O.", "avatar": "", "reward": 50, "achieved": true, "createdAt": "..." } ] }
```

### `POST /referrals/apply` — Apply someone else's referral code

**Auth:** required. (Usually applied automatically at signup via
`schoolCode`-style `referralCode` field — this endpoint covers applying one
to an already-existing account.)

```json
// Request
{ "code": "ADA7K2QX" }
// Response
{ "data": { "applied": true } }
```

---

## 21. Settings, Downloads, Premium, Help

### `GET /settings` / `PATCH /settings`

**Auth:** required

```json
// GET response
{
  "data": {
    "notifications": { "dailyReminder": true, "streakAlerts": true, "weeklyDigest": true, "achievementAlerts": true },
    "study": { "dailyGoalMinutes": 60, "difficultyPreference": "adaptive" },
    "theme": "system"
  }
}

// PATCH request — partial, nested keys merge (not overwrite)
{ "study": { "dailyGoalMinutes": 45 }, "theme": "dark" }
```

### `GET /downloads` / `DELETE /downloads/:id`

**Auth:** required

```json
// GET response
{ "data": { "items": [ { "id": "...", "title": "Physics Ch.4.pdf", "kind": "pdf", "sizeMb": 4.2, "createdAt": "..." } ], "storageUsedMb": 4.2 } }
```

### `GET /premium/plans`

**Auth:** required

```json
{
  "data": {
    "plans": [
      { "key": "free", "title": "Free", "price": 0, "features": ["Practice mode", "50 AI messages/day", "..."] },
      { "key": "premium", "title": "Premium", "price": 1500, "features": ["Unlimited AI tutor messages", "..."] }
    ],
    "currentPlan": "free"
  }
}
```

### `POST /premium/upgrade`

**Auth:** required. **Always returns `400`** in this deployment — no
payment processor is wired up. Not a placeholder pretending to work; it's
an explicit refusal until real payment integration exists.

### `GET /help/faqs`

**Auth:** none

```json
{ "data": [ { "id": "1", "question": "How do I earn Page Coins?", "answer": "..." } ] }
```

### `POST /help/contact`

**Auth:** required

```json
// Request
{ "subject": "Can't submit CBT exam", "message": "The submit button does nothing on the last question." }
// 201 Response
{ "data": { "id": "665f7...", "status": "open" } }
```

---

## 22. Notifications

### `GET /notifications` — My notifications (latest 50)

**Auth:** required

```json
{ "data": [ { "id": "...", "title": "7-day streak!", "body": "You've studied 7 days in a row. Keep it going!", "type": "streak", "read": false, "createdAt": "..." } ] }
```

`type` is one of: `achievement`, `streak`, `mission`, `system`, `reminder`.

### `POST /notifications/:id/read` — Mark one as read

**Auth:** required → `{ "data": { "id": "...", "read": true } }`

### `POST /notifications/read-all` — Mark all as read

**Auth:** required → `{ "data": { "markedAllRead": true } }`

---

## 23. Uploads (Cloudinary)

Two-step flow — file bytes never pass through this API server:

### Step 1 — `POST /uploads/sign`

**Auth:** required

```json
// Request
{ "fileName": "biology-notes.pdf", "kind": "document" }   // kind: image | pdf | video | document
// 201 Response
{
  "data": {
    "fileId": "665f8...",
    "uploadUrl": "https://api.cloudinary.com/v1_1/<cloud>/raw/upload",
    "method": "POST",
    "fields": {
      "api_key": "...", "timestamp": 1753000000, "signature": "...",
      "public_id": "pageai/document/aB3xQ...", "folder": "pageai"
    },
    "maxSizeBytes": 52428800
  }
}
```

### Step 2 — client uploads directly to Cloudinary

Build a multipart form with the file plus every field under `fields`
above, and POST it to `uploadUrl`. This request does **not** go to the
Page.AI API — it's a direct request to Cloudinary.

```bash
curl -X POST "$uploadUrl" \
  -F "file=@biology-notes.pdf" \
  -F "api_key=..." -F "timestamp=..." -F "signature=..." \
  -F "public_id=pageai/document/aB3xQ..." -F "folder=pageai"
```

### Step 3 — `POST /uploads/:fileId/confirm`

**Auth:** required. Tells the API the upload finished; the server
independently verifies the file actually exists on Cloudinary (doesn't
trust client-reported size/type).

```json
// Request (optional — server-verified values win if available)
{ "sizeBytes": 204800, "mimeType": "application/pdf" }
// Response
{ "data": { "id": "665f8...", "fileName": "biology-notes.pdf", "kind": "document", "url": "https://res.cloudinary.com/...", "sizeBytes": 204800 } }
```

Use the returned `id`/`fileId` with `POST /chat/upload` to turn it into a
Chat-with-Book source (§9).

---

## 24. Search

### `GET /search?q=<query>` — Search subjects and resources

**Auth:** required

```json
{
  "data": {
    "subjects": [ { "id": "...", "name": "Mathematics", "icon": "calculator", "type": "subject" } ],
    "resources": [ { "id": "...", "title": "Intro to Trigonometry", "type": "resource", "resourceType": "video" } ]
  }
}
```

v1 implementation (regex-based) — fine at current content volume, flagged
in `README.md` as needing a real search index at scale.
## 25. Offline Sync

Design rationale and conflict-resolution details are in `README.md` →
"Offline sync". This section is the practical how-to-consume-it guide.

### `GET /sync/state?since=<ISO timestamp>` — Pull everything that changed

**Auth:** required. Omit `since` entirely for a full initial sync (e.g.
first app launch, or after a long time offline).

```json
// GET /sync/state?since=2026-07-18T09:00:00.000Z

{
  "data": {
    "syncToken": "2026-07-19T14:32:10.481Z",
    "catalog": {
      "subjects": [ /* Subject docs updated since `since` */ ],
      "topics": [], "resources": [], "missions": [], "achievements": [],
      "storeItems": [], "featureFlags": [], "examConfigs": []
    },
    "user": {
      "wallet": [ /* your Wallet doc, if it changed */ ],
      "streak": [], "settings": [], "subjectProgress": [],
      "notifications": [], "studyPlan": []
    }
  }
}
```

**Client pattern:**
1. On first launch, call with no `since` — cache everything returned.
2. Store `syncToken` from the response.
3. On every subsequent sync (reconnect, app foreground, periodic timer),
   call `GET /sync/state?since=<last stored syncToken>` and merge the
   (usually small) delta into local storage. Store the new `syncToken`.
4. `catalog` data is safe to cache aggressively (shared across all users).
   `user` data should be treated as this-device's latest known state.

### `POST /sync/actions` — Replay actions recorded while offline

**Auth:** required. Send everything the user did offline in one batch,
**in the order they happened** (order matters — see README).

```json
// Request
{
  "deviceId": "device-abc123",
  "actions": [
    {
      "clientActionId": "local-uuid-1",
      "type": "practice_attempt",
      "payload": { "questionId": "665f4...", "chosenIndex": 1 },
      "occurredAt": "2026-07-19T08:12:00.000Z"
    },
    {
      "clientActionId": "local-uuid-2",
      "type": "flashcard_review",
      "payload": { "deckId": "665f3...", "cardId": "665f3a...", "rating": "good" },
      "occurredAt": "2026-07-19T08:15:00.000Z"
    },
    {
      "clientActionId": "local-uuid-3",
      "type": "settings_update",
      "payload": { "study": { "dailyGoalMinutes": 90 } },
      "occurredAt": "2026-07-19T08:20:00.000Z"
    }
  ]
}
```

```json
// Response
{
  "data": {
    "results": [
      { "clientActionId": "local-uuid-1", "status": "applied", "result": { "isCorrect": false, "masteryScore": 0.42, "...": "..." } },
      { "clientActionId": "local-uuid-2", "status": "applied", "result": { "nextDueAt": "2026-07-22T08:15:00.000Z" } },
      { "clientActionId": "local-uuid-3", "status": "conflict", "result": { "serverUpdatedAt": "2026-07-19T08:18:00.000Z" } }
    ]
  }
}
```

**Action types and their `payload` shape:**

| `type` | `payload` shape | Mirrors live endpoint |
|---|---|---|
| `practice_attempt` | `{ questionId, chosenIndex }` | `POST /practice/attempts` |
| `cbt_submit` | `{ examId, answers, timeTakenSeconds }` | `POST /cbt/:examId/submit` |
| `flashcard_review` | `{ deckId, cardId, rating }` | `POST /flashcards/:deckId/cards/:cardId/review` |
| `mission_claim` | `{ missionId }` | `POST /wallet/missions/:id/claim` |
| `settings_update` | same shape as `PATCH /settings` body | `PATCH /settings` |
| `study_plan_update` | `{ entries: [...], dailyGoalMinutes }` | (no direct live endpoint yet) |

**`status` values in the response:**
- `"applied"` — succeeded; `result` matches what the equivalent live
  endpoint would have returned.
- `"duplicate"` — this exact `clientActionId` was already applied in a
  previous batch (safe to resend after a network failure — it won't double-apply).
- `"conflict"` — (only for `settings_update`/`study_plan_update`) the
  server document was edited more recently than this offline action
  happened. `result.serverUpdatedAt` tells you when. **Your client should
  re-fetch the current server state and decide whether to discard the
  offline edit or re-apply it on top of the newer state** — the server
  does not guess for you.
- `"failed"` — the action errored (e.g. the question/deck/exam no longer
  exists). `error` contains the message.

**Idempotency:** always generate `clientActionId` client-side (e.g. a
UUID) when the action is first recorded offline, and reuse the same id if
you retry sending the same batch. Never regenerate it on retry.
## 26. Admin API

Every endpoint below requires `Authorization: Bearer <token>` for a user
whose `role` is `moderator`, `school_admin`, or `super_admin`. Roles below
each endpoint indicate additional restrictions beyond "any admin role."

**Multi-tenancy note:** `super_admin` and `moderator` see everything,
platform-wide. `school_admin` automatically only sees/manages their own
school's users, content, exam configs, and store items — every listing is
silently filtered, and every mutation on an out-of-scope target returns
`403 FORBIDDEN`. See `README.md` → "Multi-tenancy" for full details.

### 26.1 Dashboard

#### `GET /admin/dashboard`

```json
{
  "data": {
    "stats": { "totalUsers": 1204, "newUsers30d": 88, "totalAttempts": 45210, "totalExamAttempts": 3040, "openReports": 4, "aiMessages30d": 9120 },
    "growthTrend": [ { "date": "2026-07-18", "count": 12 } ],
    "aiUsage": { "messages30d": 9120 },
    "systemHealth": [ { "name": "database", "status": "operational", "latencyMs": 0, "uptimePercent": 100 } ]
  }
}
```

### 26.2 Users

#### `GET /admin/users` — `?search=&page=&pageSize=`
```json
{ "data": { "items": [ { "id": "...", "name": "...", "email": "...", "role": "student", "status": "active", "schoolId": "..." } ], "page": 1, "pageSize": 20, "total": 1204 } }
```

#### `GET /admin/users/:id`
Returns a single user (same shape as list items).

#### `PATCH /admin/users/:id` — requires `users:edit`
```json
{ "name": "...", "role": "teacher", "school": "..." }
```

#### `POST /admin/users/:id/suspend` — requires `users:suspend`
#### `POST /admin/users/:id/ban` — requires `users:ban`
#### `POST /admin/users/:id/reinstate` — requires `users:ban`

All three take no body, return the updated user.

#### `DELETE /admin/users/:id` — `super_admin` only

### 26.3 Content (learning resources)

#### `GET /admin/content` — `?page=&pageSize=`
```json
{ "data": { "items": [ { "id": "...", "type": "video", "title": "...", "subject": "Mathematics", "status": "published", "schoolId": null } ], "page": 1, "pageSize": 20, "total": 340 } }
```

#### `POST /admin/content` — requires `content:edit`
```json
// Request
{
  "title": "Intro to Trigonometry", "type": "video", "subjectId": "665f0...",
  "url": "https://...", "durationMinutes": 12, "description": "...",
  "schoolId": null   // ignored for school_admin — always forced to their own school
}
// 201 Response
{ "data": { "id": "...", "title": "...", "type": "video", "schoolId": null } }
```

#### `PATCH /admin/content/:id` — requires `content:edit`
Same body shape as create, all fields optional. `403` if a `school_admin`
targets content outside their school.

#### `PATCH /admin/content/:id/status` — requires `content:edit`
```json
{ "status": "flagged" }   // published | draft | flagged | removed
```

#### `DELETE /admin/content/:id` — requires `content:edit`

### 26.4 Exam configs (CBT papers/mock exams)

Same CRUD pattern as content, on `ExamConfig`.

#### `GET /admin/exams` — `?page=&pageSize=`
#### `POST /admin/exams` — requires `content:edit`
```json
{
  "title": "Demo School Mock — Mathematics", "subject": "Mathematics",
  "board": "Mock", "kind": "mock_exam", "durationMinutes": 60,
  "questionCount": 40, "hasCalculator": true, "coinsReward": 50,
  "schoolId": null
}
```
#### `PATCH /admin/exams/:id` — requires `content:edit`
#### `DELETE /admin/exams/:id` — requires `content:edit`

### 26.5 Store items (wallet redemptions)

Same CRUD pattern again, on `StoreItem`.

#### `GET /admin/store-items` — `?page=&pageSize=`
#### `POST /admin/store-items` — requires `content:edit`
```json
{ "title": "3 Days Premium", "cost": 300, "kind": "premium_time", "description": "...", "schoolId": null }
```
#### `PATCH /admin/store-items/:id` — requires `content:edit`
#### `DELETE /admin/store-items/:id` — requires `content:edit`

### 26.6 Reports (moderation)

#### `GET /admin/reports` — requires `reports:view` — `?status=&page=&pageSize=`
```json
{ "data": { "items": [ { "id": "...", "reason": "Inappropriate content", "status": "open", "targetType": "resource", "targetId": "...", "reportedBy": { "name": "...", "email": "..." }, "notes": "" } ], "page": 1, "pageSize": 20, "total": 4 } }
```
`school_admin` sees only reports filed by their own school's users.

#### `PATCH /admin/reports/:id` — requires `reports:update`
```json
{ "status": "resolved", "notes": "Content removed" }
```

### 26.7 Withdrawals (store-credit redemption review)

Surfaces `wallet_transactions` where `category=store, type=spent` for
oversight — not a cash payout queue (redemptions themselves are instant
and in-app-only; see §19). Approve is an audit acknowledgement; reject
refunds the credit.

#### `GET /admin/withdrawals` — requires `withdrawals:view` — `?status=&page=&pageSize=`
#### `POST /admin/withdrawals/:id/approve` — requires `withdrawals:approve`
#### `POST /admin/withdrawals/:id/reject` — requires `withdrawals:reject` (refunds the spent credit)

### 26.8 Analytics

#### `GET /admin/analytics`
```json
{
  "data": {
    "usersByRole": [ { "_id": "student", "count": 1180 } ],
    "subjectPopularity": [ { "subjectName": "Mathematics", "count": 12400 } ],
    "examAvgScores": [ { "examTitle": "WAEC Mathematics Mock 2026", "avgScore": 0.68, "attempts": 210 } ]
  }
}
```

### 26.9 Feature flags — `super_admin` only

#### `GET /admin/feature-flags`
#### `PUT /admin/feature-flags`
```json
{ "key": "offline_sync", "label": "Offline Sync", "description": "...", "enabled": true, "rolloutPercent": 100 }
```
(Upsert by `key`.)
#### `DELETE /admin/feature-flags/:key`

### 26.10 Roles — `super_admin` only

#### `GET /admin/roles`
```json
{ "data": [ { "role": "school_admin", "permissions": ["users:suspend", "content:edit", "..."] } ] }
```
#### `PUT /admin/roles/:role`
```json
{ "permissions": ["users:suspend", "users:ban", "content:edit"] }
```

### 26.11 Audit logs — `super_admin` only

#### `GET /admin/audit-logs` — `?page=&pageSize=`
```json
{ "data": { "items": [ { "id": "...", "actor": { "name": "...", "role": "school_admin" }, "action": "suspend_user", "target": "665f9...", "ip": "203.0.113.4", "createdAt": "..." } ], "page": 1, "pageSize": 30, "total": 512 } }
```
Every admin mutation writes one of these automatically — nothing to do to populate it.

### 26.12 System health

#### `GET /admin/system-health`
```json
{ "data": { "services": [ { "name": "database", "status": "operational", "latencyMs": 0, "uptimePercent": 100 } ], "checkedAt": "..." } }
```

### 26.13 Schools (multi-tenancy)

**Global management** — `moderator`/`super_admin` view, `super_admin` mutates:

#### `GET /admin/schools` — `?page=&pageSize=`
#### `POST /admin/schools` — `super_admin` only
```json
// Request
{ "name": "Demo Academy", "address": "...", "contactEmail": "admin@demoacademy.edu", "ownerUserId": "665fA..." }
// 201 Response
{ "data": { "id": "...", "name": "Demo Academy", "code": "K7QX9RTM", "plan": "free" } }
```
If `ownerUserId` is provided, that user is immediately promoted to
`school_admin` and assigned to this school. Share the returned `code` with
students so they can join via `schoolCode` at signup.

#### `GET /admin/schools/:id` — `moderator`/`super_admin`
#### `PATCH /admin/schools/:id` — `super_admin` only
```json
{ "plan": "school_premium", "active": true }
```

**Self-service** — `school_admin` only, always scoped to their own school
(never a client-supplied id, so a `school_admin` can't target another school):

#### `GET /admin/schools/me/profile`
#### `PATCH /admin/schools/me/profile`
```json
{ "name": "Demo Academy (Updated)", "contactEmail": "principal@demoacademy.edu" }
```
#### `GET /admin/schools/me/students` — `?page=&pageSize=`
```json
{ "data": { "items": [ { "id": "...", "name": "Ada Lovelace", "email": "...", "role": "student" } ], "page": 1, "pageSize": 20, "total": 340 } }
```

---

## Appendix: role → permission reference

| Permission | `moderator` | `school_admin` | `super_admin` |
|---|:---:|:---:|:---:|
| `users:suspend` / `users:ban` | ✅ | ✅ | ✅ (implicit) |
| `users:edit` | ❌ | ✅ | ✅ |
| `reports:view` / `reports:update` | ✅ | ✅ | ✅ |
| `content:view` | ✅ | ✅ | ✅ |
| `content:edit` (also gates exam configs & store items) | ❌ | ✅ | ✅ |
| `withdrawals:view` / `approve` / `reject` | ❌ | ✅ | ✅ |
| Feature flags, roles, audit logs, school CRUD | ❌ | ❌ | ✅ only |

`super_admin` has every permission implicitly (`["*"]`) — the table above
reflects `moderator`/`school_admin`'s explicit grants from
`constants/roles.js`, editable at runtime via `PUT /admin/roles/:role`.

---

## 27. Platform Integration Guides

The API itself is identical across platforms (§1) — what differs is how
each platform stores tokens, handles CORS, consumes streaming responses,
and talks to the network. This section is concrete, copy-pasteable setup
for each.

All three examples below share the same core client logic (attach the
Bearer token, retry once on `401` via `/auth/refresh`); only token storage
and the streaming/network bits change per platform.

---

### 27.1 Web (browser — React, Vue, plain JS, etc.)

**Token storage:** Since this API is stateless Bearer-token auth (no
cookies), tokens must be stored client-side. `localStorage` is the common
choice but is readable by any script on the page (XSS risk) — for a
security-sensitive app, keep the access token in memory (a JS variable /
React context) and only the refresh token in `localStorage`, so a page
reload still restores the session but a XSS payload can't silently read
the long-lived credential from memory dumps as easily. The example below
uses `localStorage` for both for simplicity; swap in your app's actual
security posture.

**CORS:** the browser enforces CORS automatically — nothing to configure
client-side. Just make sure the backend's `CORS_ORIGINS` includes your
dev/prod origin (see the backend's `.env.example`); same-origin requests
(e.g. from a Swagger UI or docs page served by the API itself) are always allowed.

```javascript
// apiClient.js
const BASE_URL = "http://localhost:5000/api/v1";

function getTokens() {
  return {
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
  };
}

function setAccessToken(token) {
  localStorage.setItem("accessToken", token);
}

async function refreshAccessToken() {
  const { refreshToken } = getTokens();
  if (!refreshToken) throw new Error("No refresh token — user must log in");

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error("Refresh failed — force re-login");

  const { data } = await res.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
}

export async function apiFetch(path, options = {}, _retried = false) {
  const { accessToken } = getTokens();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  // Auto-refresh-and-retry exactly once on an expired access token.
  if (res.status === 401 && !_retried) {
    try {
      await refreshAccessToken();
      return apiFetch(path, options, true);
    } catch {
      window.location.href = "/login"; // or your app's logout handler
      throw new Error("Session expired");
    }
  }

  const body = await res.json();
  if (!res.ok) throw Object.assign(new Error(body.message), { code: body.code, details: body.details });
  return body.data;
}
```

```javascript
// Usage
const dashboard = await apiFetch("/dashboard");
const { user, tokens } = await apiFetch("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});
localStorage.setItem("accessToken", tokens.accessToken);
localStorage.setItem("refreshToken", tokens.refreshToken);
```

**Streaming (`POST /ai/chat/stream`)** — use `fetch` + a stream reader
directly (native `EventSource` only supports `GET`, and this endpoint is a
`POST`):

```javascript
async function streamChat(messages, onToken) {
  const { accessToken } = getTokens();
  const res = await fetch(`${BASE_URL}/ai/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ messages }),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n\n");
    buffer = lines.pop(); // keep any incomplete chunk for next read
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") return;
      onToken(JSON.parse(payload).token);
    }
  }
}
```

---

### 27.2 React Native

**Token storage:** use `expo-secure-store` (Expo) or
`react-native-keychain` (bare RN) instead of `AsyncStorage` for the
refresh token — `AsyncStorage` is unencrypted on-device storage, fine for
the access token (short-lived) but not ideal for the long-lived refresh
token.

```javascript
// apiClient.js
import * as SecureStore from "expo-secure-store"; // or react-native-keychain equivalent

const BASE_URL = "http://10.0.2.2:5000/api/v1"; // Android emulator -> host machine
// iOS simulator: http://localhost:5000/api/v1
// Physical device: your machine's LAN IP, e.g. http://192.168.1.20:5000/api/v1

async function getTokens() {
  return {
    accessToken: await SecureStore.getItemAsync("accessToken"),
    refreshToken: await SecureStore.getItemAsync("refreshToken"),
  };
}

async function setAccessToken(token) {
  await SecureStore.setItemAsync("accessToken", token);
}

async function refreshAccessToken() {
  const { refreshToken } = await getTokens();
  if (!refreshToken) throw new Error("No refresh token — user must log in");

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error("Refresh failed — force re-login");

  const { data } = await res.json();
  await setAccessToken(data.accessToken);
  return data.accessToken;
}

export async function apiFetch(path, options = {}, _retried = false) {
  const { accessToken } = await getTokens();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && !_retried) {
    try {
      await refreshAccessToken();
      return apiFetch(path, options, true);
    } catch {
      // navigate to your login screen / clear auth state
      throw new Error("Session expired");
    }
  }

  const body = await res.json();
  if (!res.ok) throw Object.assign(new Error(body.message), { code: body.code, details: body.details });
  return body.data;
}
```

**CORS:** React Native's `fetch` is not a browser — there is no CORS
enforcement at all on this platform. The backend's CORS allow-list exists
purely for browser-based clients; nothing to configure here.

**Streaming (`POST /ai/chat/stream`):** React Native's `fetch` does not
expose a readable stream the same way browsers do. Two options:
1. Skip streaming — call `POST /ai/chat` (non-streamed) instead, and show
   a loading indicator. Simplest, works everywhere.
2. Use a library like [`react-native-sse`](https://www.npmjs.com/package/react-native-sse)
   or `fetch-event-source`'s RN-compatible fork if you need token-by-token
   rendering. Point it at `POST /ai/chat/stream` with the same headers/body
   as the web example.

**Offline sync integration:** pair `@react-native-community/netinfo` with
the sync endpoints (§25):

```javascript
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

NetInfo.addEventListener(async (state) => {
  if (state.isConnected) {
    const queued = JSON.parse((await AsyncStorage.getItem("pendingActions")) || "[]");
    if (queued.length > 0) {
      const { results } = await apiFetch("/sync/actions", {
        method: "POST",
        body: JSON.stringify({ deviceId: await getDeviceId(), actions: queued }),
      });
      // Remove applied/duplicate actions from the local queue; keep failed/conflict
      // ones for the user to review (see §25 for what each status means).
      const stillPending = queued.filter((a, i) =>
        !["applied", "duplicate"].includes(results[i].status),
      );
      await AsyncStorage.setItem("pendingActions", JSON.stringify(stillPending));

      const since = await AsyncStorage.getItem("syncToken");
      const { syncToken, catalog, user } = await apiFetch(`/sync/state${since ? `?since=${since}` : ""}`);
      // merge catalog/user into local state...
      await AsyncStorage.setItem("syncToken", syncToken);
    }
  }
});
```

While offline, write actions to the local `pendingActions` queue instead
of calling the live endpoints directly (e.g. `/practice/attempts`) — flush
the queue through `/sync/actions` once connectivity returns.

---

### 27.3 Electron

Electron has two processes with very different networking behavior — pick
one pattern and be consistent:

**Option A — renderer calls the API directly (like a web app).** Simplest,
works if `contextIsolation`/`webSecurity` aren't creating friction. The
renderer's `fetch` behaves like a browser's, so it IS subject to CORS —
the backend already allows `file://`/`app://` origins and requests with no
`Origin` header, so a packaged Electron app's renderer works out of the
box (see `README.md` → Cross-client design). Use the exact same
`apiClient.js` as the Web example (§27.1), swapping `localStorage` for
Electron's `session.cookies`/`localStorage` (same API, works fine in the
renderer) or a preload-exposed secure store (Option B) if you want the
token off the renderer's JS context entirely.

**Option B — main process calls the API, renderer talks to main via IPC.**
More secure (tokens never touch renderer JS, immune to a renderer-side
XSS), and main-process requests have no `Origin` header at all so CORS
never applies. Recommended if you're using `contextIsolation: true` (the
Electron-recommended default) and want tokens stored with OS-level
encryption via `safeStorage`.

```javascript
// main/apiClient.js (runs in the Electron MAIN process)
const { safeStorage } = require("electron");
const Store = require("electron-store"); // or any small on-disk JSON store
const store = new Store();

const BASE_URL = "http://localhost:5000/api/v1";

function getAccessToken() {
  const enc = store.get("accessToken");
  return enc ? safeStorage.decryptString(Buffer.from(enc, "base64")) : null;
}
function setAccessToken(token) {
  store.set("accessToken", safeStorage.encryptString(token).toString("base64"));
}
function getRefreshToken() {
  const enc = store.get("refreshToken");
  return enc ? safeStorage.decryptString(Buffer.from(enc, "base64")) : null;
}
function setRefreshToken(token) {
  store.set("refreshToken", safeStorage.encryptString(token).toString("base64"));
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token — user must log in");

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error("Refresh failed — force re-login");

  const { data } = await res.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
}

async function apiFetch(path, options = {}, _retried = false) {
  const accessToken = getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && !_retried) {
    await refreshAccessToken();
    return apiFetch(path, options, true);
  }

  const body = await res.json();
  if (!res.ok) throw Object.assign(new Error(body.message), { code: body.code, details: body.details });
  return body.data;
}

module.exports = { apiFetch, setAccessToken, setRefreshToken };
```

```javascript
// main/ipc.js — expose it to the renderer via IPC, not direct network access
const { ipcMain } = require("electron");
const { apiFetch } = require("./apiClient");

ipcMain.handle("api:call", async (_event, path, options) => {
  try {
    return { ok: true, data: await apiFetch(path, options) };
  } catch (err) {
    return { ok: false, message: err.message, code: err.code };
  }
});
```

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  call: (path, options) => ipcRenderer.invoke("api:call", path, options),
});
```

```javascript
// renderer code
const result = await window.api.call("/dashboard");
if (!result.ok) throw new Error(result.message);
console.log(result.data);
```

**Streaming (`POST /ai/chat/stream`) with Option B:** proxy it through IPC
events instead of a single `invoke` — have the main process read the
stream and `webContents.send()` each token to the renderer:

```javascript
// main process
ipcMain.on("api:chat-stream-start", async (event, { messages }) => {
  const accessToken = getAccessToken();
  const res = await fetch(`${BASE_URL}/ai/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ messages }),
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") return event.sender.send("api:chat-stream-done");
      event.sender.send("api:chat-stream-token", JSON.parse(payload).token);
    }
  }
});
```

**Offline sync:** use Node's `net`/`dns` in the main process (or simply
`navigator.onLine` in the renderer) to detect connectivity, and the same
`pendingActions` queue pattern as the React Native example — an Electron
app is at least as likely to be used offline (laptop, no wifi) as a mobile app.
