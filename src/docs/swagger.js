// Generated to mirror the implemented routes 1:1 (per the "Swagger must
// match the implemented backend exactly" success criterion). Request/response
// bodies are intentionally summarized rather than fully typed per field —
// see API_CONTRACT.md for the canonical field-level shapes the frontend
// expects; this keeps the two documents from drifting by not duplicating
// the whole contract redundantly.

const bearerAuth = { bearerAuth: [] };

const successEnvelope = (dataSchema = { type: "object" }) => ({
  type: "object",
  properties: { data: dataSchema, message: { type: "string" } },
});

const errorEnvelope = {
  type: "object",
  properties: {
    message: { type: "string" },
    code: { type: "string" },
    details: {},
  },
};

const simpleGet = (summary, tags, security = [bearerAuth]) => ({
  get: {
    summary,
    tags,
    security,
    responses: {
      200: { description: "OK", content: { "application/json": { schema: successEnvelope() } } },
      401: { description: "Unauthorized", content: { "application/json": { schema: errorEnvelope } } },
    },
  },
});

const simplePost = (summary, tags, security = [bearerAuth]) => ({
  post: {
    summary,
    tags,
    security,
    requestBody: { content: { "application/json": { schema: { type: "object" } } } },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: successEnvelope() } } },
      401: { description: "Unauthorized", content: { "application/json": { schema: errorEnvelope } } },
      422: { description: "Validation error", content: { "application/json": { schema: errorEnvelope } } },
    },
  },
});

export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Page.AI Backend API",
    version: "1.0.0",
    description:
      "REST API for the Page.AI learning platform. Consumed identically by Web, React Native, and Electron clients via Bearer-token auth (see AUDIT_REPORT.md).",
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  tags: [
    "Auth", "Users", "Dashboard", "Subjects", "Resources", "AI", "AI Tutor", "Chat with Book",
    "Flashcards", "Study Planner", "Practice", "CBT", "Mistakes", "Progress", "Achievements",
    "Streaks", "History", "Wallet", "Referrals", "Settings", "Downloads", "Premium", "Help",
    "Notifications", "Uploads", "Search", "Sync", "Admin", "Schools",
  ],
  paths: {
    "/auth/signup": { post: { ...simplePost("Create an account", ["Auth"], []).post } },
    "/auth/login": { post: { ...simplePost("Login with email/password", ["Auth"], []).post } },
    "/auth/google": { post: { ...simplePost("Login/signup with Google", ["Auth"], []).post } },
    "/auth/refresh": { post: { ...simplePost("Exchange a refresh token for a new access token", ["Auth"], []).post } },
    "/auth/logout": { post: { ...simplePost("Invalidate a refresh token", ["Auth"], []).post } },
    "/auth/forgot-password": { post: { ...simplePost("Request a password reset", ["Auth"], []).post } },
    "/auth/session": { ...simpleGet("Get the current session (if any)", ["Auth"], []) },

    "/users/me": {
      ...simpleGet("Get my profile", ["Users"]),
      patch: { summary: "Update my profile", tags: ["Users"], security: [bearerAuth], responses: { 200: { description: "OK" } } },
      delete: { summary: "Delete my account", tags: ["Users"], security: [bearerAuth], responses: { 200: { description: "OK" } } },
    },

    "/dashboard": { ...simpleGet("Get the dashboard aggregate", ["Dashboard"]) },

    "/subjects": { ...simpleGet("List subjects with progress", ["Subjects"]) },
    "/subjects/{id}": { ...simpleGet("Get one subject with topics", ["Subjects"]) },

    "/resources": { ...simpleGet("List/search resources", ["Resources"]) },
    "/resources/{id}/bookmark": { ...simplePost("Bookmark/unbookmark a resource", ["Resources"]) },

    "/ai/chat": { ...simplePost("Single-shot AI chat", ["AI"]) },
    "/ai/chat/stream": { ...simplePost("SSE-streamed AI chat", ["AI"]) },
    "/ai/remediate": { ...simplePost("Get a remediation explanation for a wrong answer", ["AI"]) },
    "/ai/mnemonic": { ...simplePost("Get a mnemonic for a concept", ["AI"]) },
    "/ai/vision": { ...simplePost("(Not implemented) Vision/document understanding", ["AI"]) },
    "/ai/documents": { ...simplePost("(Not implemented) Long-document AI processing", ["AI"]) },

    "/ai/tutor/capabilities": { ...simpleGet("List AI Tutor capability cards", ["AI Tutor"]) },
    "/ai/tutor/message": { ...simplePost("Send a message to the AI Tutor", ["AI Tutor"]) },

    "/chat/sources": { ...simpleGet("List my chat-with-book sources", ["Chat with Book"]) },
    "/chat/{sourceId}/message": { ...simplePost("Send a message about a source", ["Chat with Book"]) },
    "/chat/upload": { ...simplePost("Register an uploaded document as a chat source", ["Chat with Book"]) },

    "/flashcards/decks": { ...simpleGet("List my flashcard decks", ["Flashcards"]) },
    "/flashcards/{deckId}/cards/{cardId}/review": { ...simplePost("Review a card (SM-2-lite)", ["Flashcards"]) },
    "/flashcards/generate": { ...simplePost("AI-generate a new deck", ["Flashcards"]) },

    "/planner": { ...simpleGet("Get my study plan and recommendations", ["Study Planner"]) },

    "/practice/subjects": { ...simpleGet("List practice subjects", ["Practice"]) },
    "/practice/subjects/{subject}/topics": { ...simpleGet("List topics for a subject", ["Practice"]) },
    "/practice/questions": { ...simpleGet("List practice questions", ["Practice"]) },
    "/practice/attempts": { ...simplePost("Record a practice attempt", ["Practice"]) },

    "/cbt/papers": { ...simpleGet("List past-question papers", ["CBT"]) },
    "/cbt/mock-exams": { ...simpleGet("List mock exams", ["CBT"]) },
    "/cbt/{examId}/questions": { ...simpleGet("Get an exam's questions", ["CBT"]) },
    "/cbt/{examId}/submit": { ...simplePost("Submit answers for scoring", ["CBT"]) },

    "/mistakes": { ...simpleGet("List my mistake book entries", ["Mistakes"]) },

    "/progress/analytics": { ...simpleGet("Get heatmap/trend/topic analytics", ["Progress"]) },
    "/progress/weak-areas": { ...simpleGet("Get my weakest topics", ["Progress"]) },

    "/achievements": { ...simpleGet("List achievements and my progress", ["Achievements"]) },

    "/streaks": { ...simpleGet("Get my streak", ["Streaks"]) },

    "/history": { ...simpleGet("Get my paginated learning history", ["History"]) },

    "/wallet": { ...simpleGet("Get my wallet summary", ["Wallet"]) },
    "/wallet/missions": { ...simpleGet("List today's missions", ["Wallet"]) },
    "/wallet/missions/{id}/claim": { ...simplePost("Claim a completed mission", ["Wallet"]) },
    "/wallet/rewards/recent": { ...simpleGet("List recent coin rewards", ["Wallet"]) },
    "/wallet/store": { ...simpleGet("List store items", ["Wallet"]) },
    "/wallet/store/{itemId}/redeem": { ...simplePost("Redeem a store item", ["Wallet"]) },
    "/wallet/breakdown": { ...simpleGet("Get coin-earning breakdown by category", ["Wallet"]) },
    "/wallet/transactions": { ...simpleGet("Get paginated wallet transactions", ["Wallet"]) },

    "/referrals": { ...simpleGet("Get my referral code/stats", ["Referrals"]) },
    "/referrals/recent": { ...simpleGet("List recently referred users", ["Referrals"]) },
    "/referrals/apply": { ...simplePost("Apply a referral code", ["Referrals"]) },

    "/settings": {
      ...simpleGet("Get my settings", ["Settings"]),
      patch: { summary: "Update my settings", tags: ["Settings"], security: [bearerAuth], responses: { 200: { description: "OK" } } },
    },

    "/downloads": {
      ...simpleGet("List my downloads", ["Downloads"]),
      delete: { summary: "Delete a download record", tags: ["Downloads"], security: [bearerAuth], responses: { 200: { description: "OK" } } },
    },

    "/premium/plans": { ...simpleGet("List premium plans", ["Premium"]) },
    "/premium/upgrade": { ...simplePost("Upgrade to Premium (requires payment integration)", ["Premium"]) },

    "/help/faqs": { ...simpleGet("List FAQs", ["Help"], []) },
    "/help/contact": { ...simplePost("Submit a support ticket", ["Help"]) },

    "/notifications": { ...simpleGet("List my notifications", ["Notifications"]) },
    "/notifications/{id}/read": { ...simplePost("Mark one notification read", ["Notifications"]) },
    "/notifications/read-all": { ...simplePost("Mark all notifications read", ["Notifications"]) },

    "/uploads/sign": { ...simplePost("Get a signed upload URL", ["Uploads"]) },
    "/uploads/{fileId}/confirm": { ...simplePost("Confirm an upload completed", ["Uploads"]) },

    "/search": { ...simpleGet("Search subjects and resources", ["Search"]) },

    "/sync/state": { ...simpleGet("Get everything changed since a sync token (offline sync)", ["Sync"]) },
    "/sync/actions": { ...simplePost("Replay a batch of offline actions (idempotent)", ["Sync"]) },

    "/admin/dashboard": { ...simpleGet("Admin dashboard aggregate", ["Admin"]) },
    "/admin/users": { ...simpleGet("List users (admin)", ["Admin"]) },
    "/admin/users/{id}": { ...simpleGet("Get a user (admin)", ["Admin"]) },
    "/admin/users/{id}/suspend": { ...simplePost("Suspend a user", ["Admin"]) },
    "/admin/users/{id}/ban": { ...simplePost("Ban a user", ["Admin"]) },
    "/admin/users/{id}/reinstate": { ...simplePost("Reinstate a user", ["Admin"]) },
    "/admin/content": {
      ...simpleGet("List content (admin, tenant-scoped)", ["Admin"]),
      post: { summary: "Create content (admin, tenant-scoped)", tags: ["Admin"], security: [bearerAuth], responses: { 201: { description: "Created" } } },
    },
    "/admin/content/{id}": {
      patch: { summary: "Update content", tags: ["Admin"], security: [bearerAuth], responses: { 200: { description: "OK" } } },
      delete: { summary: "Delete content", tags: ["Admin"], security: [bearerAuth], responses: { 200: { description: "OK" } } },
    },
    "/admin/content/{id}/status": {
      patch: { summary: "Update content moderation status", tags: ["Admin"], security: [bearerAuth], responses: { 200: { description: "OK" } } },
    },
    "/admin/exams": {
      ...simpleGet("List exam configs (admin, tenant-scoped)", ["Admin"]),
      post: { summary: "Create an exam config (admin, tenant-scoped)", tags: ["Admin"], security: [bearerAuth], responses: { 201: { description: "Created" } } },
    },
    "/admin/exams/{id}": {
      patch: { summary: "Update an exam config", tags: ["Admin"], security: [bearerAuth], responses: { 200: { description: "OK" } } },
      delete: { summary: "Delete an exam config", tags: ["Admin"], security: [bearerAuth], responses: { 200: { description: "OK" } } },
    },
    "/admin/store-items": {
      ...simpleGet("List store items (admin, tenant-scoped)", ["Admin"]),
      post: { summary: "Create a store item (admin, tenant-scoped)", tags: ["Admin"], security: [bearerAuth], responses: { 201: { description: "Created" } } },
    },
    "/admin/store-items/{id}": {
      patch: { summary: "Update a store item", tags: ["Admin"], security: [bearerAuth], responses: { 200: { description: "OK" } } },
      delete: { summary: "Delete a store item", tags: ["Admin"], security: [bearerAuth], responses: { 200: { description: "OK" } } },
    },
    "/admin/reports": { ...simpleGet("List moderation reports (tenant-scoped)", ["Admin"]) },
    "/admin/withdrawals": { ...simpleGet("List store-credit redemptions for review", ["Admin"]) },
    "/admin/withdrawals/{id}/approve": { ...simplePost("Approve a redemption", ["Admin"]) },
    "/admin/withdrawals/{id}/reject": { ...simplePost("Reject a redemption (refunds credit)", ["Admin"]) },
    "/admin/analytics": { ...simpleGet("Platform-wide analytics", ["Admin"]) },
    "/admin/feature-flags": { ...simpleGet("List feature flags", ["Admin"]) },
    "/admin/roles": { ...simpleGet("List role permission sets", ["Admin"]) },
    "/admin/audit-logs": { ...simpleGet("List audit log entries", ["Admin"]) },
    "/admin/system-health": { ...simpleGet("Get current system health snapshot", ["Admin"]) },

    "/admin/schools": {
      ...simpleGet("List schools (super_admin/moderator)", ["Schools"]),
      post: { summary: "Create a school (super_admin)", tags: ["Schools"], security: [bearerAuth], responses: { 201: { description: "Created" } } },
    },
    "/admin/schools/{id}": {
      ...simpleGet("Get a school by id (super_admin/moderator)", ["Schools"]),
      patch: { summary: "Update a school by id (super_admin)", tags: ["Schools"], security: [bearerAuth], responses: { 200: { description: "OK" } } },
    },
    "/admin/schools/me/profile": {
      ...simpleGet("Get my own school (school_admin)", ["Schools"]),
      patch: { summary: "Update my own school (school_admin)", tags: ["Schools"], security: [bearerAuth], responses: { 200: { description: "OK" } } },
    },
    "/admin/schools/me/students": { ...simpleGet("List my school's students (school_admin)", ["Schools"]) },
  },
};
