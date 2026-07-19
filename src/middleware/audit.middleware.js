import AuditLog from "../models/AuditLog.js";

/**
 * auditLog("suspend_user", (req) => req.params.id) — wrap any /admin/* mutation.
 * Writes an audit_logs entry AFTER a successful response, per
 * TECHNICAL_DOCUMENTATION.md §11 ("frontend assumes this is populated by
 * middleware, not a separate 'log this' call").
 */
export const auditLog =
  (action, getTarget = () => undefined) =>
  (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400) {
        AuditLog.create({
          actorId: req.user?._id,
          action,
          target: getTarget(req),
          ip: req.ip,
        }).catch((err) => console.error("[audit] failed to write audit log:", err.message));
      }
      return originalJson(body);
    };
    next();
  };
