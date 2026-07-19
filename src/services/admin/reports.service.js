import Report from "../../models/Report.js";
import User from "../../models/User.js";
import { ApiError } from "../../utils/ApiError.js";

export const listReports = async ({ status, page = 1, pageSize = 20, schoolScope } = {}) => {
  const filter = {};
  if (status) filter.status = status;

  if (schoolScope) {
    // Reports don't carry a schoolId directly — scope via the reporter's
    // school membership instead, since a school_admin's concern is
    // moderation activity involving their own students.
    const schoolUserIds = await User.find({ schoolId: schoolScope }).distinct("_id");
    filter.reportedBy = { $in: schoolUserIds };
  }

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate("reportedBy", "name email"),
    Report.countDocuments(filter),
  ]);
  return {
    items: items.map((r) => ({
      id: r._id,
      reason: r.reason,
      status: r.status,
      targetType: r.targetType,
      targetId: r.targetId,
      reportedBy: r.reportedBy,
      notes: r.notes,
      createdAt: r.createdAt,
    })),
    page: Number(page),
    pageSize: Number(pageSize),
    total,
  };
};

export const updateReport = async (id, { status, notes }) => {
  const report = await Report.findByIdAndUpdate(
    id,
    { ...(status && { status }), ...(notes !== undefined && { notes }) },
    { new: true },
  );
  if (!report) throw ApiError.notFound("Report not found");
  return report;
};
