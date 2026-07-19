import Subject from "../models/Subject.js";
import Resource from "../models/Resource.js";

/**
 * Regex-based v1 per API_CONTRACT.md §22. Production note left in place:
 * once content volume grows, move to MongoDB Atlas Search or a dedicated
 * index (Meilisearch/Typesense) rather than scaling this regex query.
 */
export const search = async (query) => {
  if (!query || query.trim().length === 0) return { subjects: [], resources: [] };
  const regex = new RegExp(query.trim(), "i");

  const [subjects, resources] = await Promise.all([
    Subject.find({ name: regex }).limit(10),
    Resource.find({ $or: [{ title: regex }, { description: regex }] }).limit(10),
  ]);

  return {
    subjects: subjects.map((s) => ({ id: s._id, name: s.name, icon: s.icon, type: "subject" })),
    resources: resources.map((r) => ({ id: r._id, title: r.title, type: "resource", resourceType: r.type })),
  };
};
