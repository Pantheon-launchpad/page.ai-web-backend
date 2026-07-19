import AuditLog from "../../models/AuditLog.js";

export const listAuditLogs = async ({ page = 1, pageSize = 30 } = {}) => {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate("actorId", "name email role"),
    AuditLog.countDocuments(),
  ]);
  return {
    items: items.map((a) => ({
      id: a._id,
      actor: a.actorId,
      action: a.action,
      target: a.target,
      ip: a.ip,
      createdAt: a.createdAt,
    })),
    page: Number(page),
    pageSize: Number(pageSize),
    total,
  };
};
