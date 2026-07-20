import Resource from "../../models/Resource.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * "Content" = the Resource collection (videos/PDFs/articles/audio/past
 * questions). Tenant-aware: schoolId null = platform-wide, set = exclusive
 * to that school. See utils/tenantFilter.js for the matching student-facing
 * read path, and assertContentInScope/resolveCreateSchoolId in
 * schoolScope.middleware.js for how mutations are restricted per-tenant.
 */
export const listContent = async ({ page = 1, pageSize = 20, schoolScope } = {}) => {
  const filter = {};
  if (schoolScope) filter.schoolId = schoolScope;

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    Resource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate("subjectId", "name"),
    Resource.countDocuments(filter),
  ]);
  return {
    items: items.map((r) => ({
      id: r._id,
      type: r.type,
      title: r.title,
      subject: r.subjectId?.name,
      status: r.status || "published",
      schoolId: r.schoolId,
      updatedAt: r.updatedAt,
    })),
    page: Number(page),
    pageSize: Number(pageSize),
    total,
  };
};

export const createContent = async (data) => {
  const resource = await Resource.create(data);
  return { id: resource._id, title: resource.title, type: resource.type, schoolId: resource.schoolId };
};

export const updateContent = async (id, updates) => {
  const resource = await Resource.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!resource) throw ApiError.notFound("Content item not found");
  return resource;
};

export const updateContentStatus = async (id, status) => {
  const resource = await Resource.findByIdAndUpdate(id, { status }, { new: true });
  if (!resource) throw ApiError.notFound("Content item not found");
  return { id: resource._id, status: resource.status };
};

export const deleteContent = async (id) => {
  const resource = await Resource.findByIdAndDelete(id);
  if (!resource) throw ApiError.notFound("Content item not found");
};
