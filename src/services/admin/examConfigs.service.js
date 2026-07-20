import ExamConfig from "../../models/ExamConfig.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Admin management of CBT papers/mock exams. Tenant-aware: schoolId null =
 * platform-wide (official WAEC/JAMB-style papers everyone sees), set = a
 * school's own custom paper/mock exam exclusive to their students.
 */
export const listExamConfigs = async ({ page = 1, pageSize = 20, schoolScope } = {}) => {
  const filter = {};
  if (schoolScope) filter.schoolId = schoolScope;

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    ExamConfig.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    ExamConfig.countDocuments(filter),
  ]);
  return { items, page: Number(page), pageSize: Number(pageSize), total };
};

export const createExamConfig = async (data) => ExamConfig.create(data);

export const updateExamConfig = async (id, updates) => {
  const exam = await ExamConfig.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!exam) throw ApiError.notFound("Exam config not found");
  return exam;
};

export const deleteExamConfig = async (id) => {
  const exam = await ExamConfig.findByIdAndDelete(id);
  if (!exam) throw ApiError.notFound("Exam config not found");
};
