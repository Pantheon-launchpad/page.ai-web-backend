import Resource from "../models/Resource.js";
import UserBookmark from "../models/UserBookmark.js";
import { tenantVisibilityFilter } from "../utils/tenantFilter.js";

export const listResources = async (user, { type, subject, search } = {}) => {
  const filter = { ...tenantVisibilityFilter(user) };
  if (type) filter.type = type;
  if (subject) filter.subjectId = subject;
  if (search) filter.$text = { $search: search };

  const [resources, bookmarks] = await Promise.all([
    Resource.find(filter).sort({ createdAt: -1 }).limit(100).populate("subjectId", "name icon color"),
    UserBookmark.find({ userId: user._id }),
  ]);
  const bookmarkedIds = new Set(bookmarks.map((b) => b.resourceId.toString()));

  return resources.map((r) => ({
    id: r._id,
    title: r.title,
    type: r.type,
    subject: r.subjectId,
    url: r.url,
    thumbnail: r.thumbnail,
    durationMinutes: r.durationMinutes,
    description: r.description,
    bookmarked: bookmarkedIds.has(r._id.toString()),
  }));
};

export const toggleBookmark = async (userId, resourceId, bookmarked) => {
  if (bookmarked) {
    await UserBookmark.updateOne(
      { userId, resourceId },
      { $setOnInsert: { userId, resourceId } },
      { upsert: true },
    );
  } else {
    await UserBookmark.deleteOne({ userId, resourceId });
  }
  return { bookmarked };
};
