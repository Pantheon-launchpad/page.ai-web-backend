export const ROLES = Object.freeze({
  STUDENT: "student",
  TEACHER: "teacher",
  MODERATOR: "moderator",
  SCHOOL_ADMIN: "school_admin",
  SUPER_ADMIN: "super_admin",
});

export const ADMIN_ROLES = [ROLES.MODERATOR, ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN];

export const ALL_ROLES = Object.values(ROLES);

// Simple string-permission model per TECHNICAL_DOCUMENTATION.md §17.
// super_admin implicitly has ["*"] — checked separately in role.middleware.js
// NOTE: "content:edit" gates mutations on Resource, ExamConfig, AND
// StoreItem — there's no separate permission per collection in this pass,
// since all three follow the identical tenant-scoped content-CRUD pattern
// (see services/admin/content|examConfigs|storeItems.service.js).
export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.MODERATOR]: [
    "users:suspend",
    "users:ban",
    "reports:view",
    "reports:update",
    "content:view",
  ],
  [ROLES.SCHOOL_ADMIN]: [
    "users:suspend",
    "users:ban",
    "users:edit",
    "reports:view",
    "reports:update",
    "content:view",
    "content:edit",
    "withdrawals:view",
    "withdrawals:approve",
    "withdrawals:reject",
  ],
  [ROLES.SUPER_ADMIN]: ["*"],
});
