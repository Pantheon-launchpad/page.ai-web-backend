import ActivityLog from "../models/ActivityLog.js";

export const getHistory = async (userId, { page = 1, pageSize = 30 } = {}) => {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    ActivityLog.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    ActivityLog.countDocuments({ userId }),
  ]);
  return {
    items: items.map((a) => ({ id: a._id, type: a.type, label: a.label, createdAt: a.createdAt })),
    page,
    pageSize,
    total,
  };
};
