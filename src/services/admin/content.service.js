import Subject from "../../models/Subject.js";
import Resource from "../../models/Resource.js";
import Question from "../../models/Question.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * "Content" spans multiple underlying collections (subjects/resources/
 * questions) that don't have a shared `status` field today — the contract
 * suggests either a dedicated admin_content collection or reusing existing
 * collections with a shared status field (TECHNICAL_DOCUMENTATION.md §14).
 * This implementation takes the reuse path: it surfaces resources (which
 * already carry the fields admin content-management needs) as "content
 * items" and treats subjects/questions as read-only reference data here.
 * A dedicated status field is added to Resource on demand below.
 */
export const listContent = async ({ page = 1, pageSize = 20 } = {}) => {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    Resource.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate("subjectId", "name"),
    Resource.countDocuments(),
  ]);
  return {
    items: items.map((r) => ({
      id: r._id,
      type: r.type,
      title: r.title,
      subject: r.subjectId?.name,
      status: r.status || "published",
      updatedAt: r.updatedAt,
    })),
    page: Number(page),
    pageSize: Number(pageSize),
    total,
  };
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
