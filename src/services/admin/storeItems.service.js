import StoreItem from "../../models/StoreItem.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Admin management of wallet store items. Tenant-aware: schoolId null =
 * platform-wide item, set = a school-branded reward exclusive to that
 * school's students (e.g. a house-points badge or a founder's-day reward).
 */
export const listStoreItemsAdmin = async ({ page = 1, pageSize = 20, schoolScope } = {}) => {
  const filter = {};
  if (schoolScope) filter.schoolId = schoolScope;

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    StoreItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    StoreItem.countDocuments(filter),
  ]);
  return { items, page: Number(page), pageSize: Number(pageSize), total };
};

export const createStoreItem = async (data) => StoreItem.create(data);

export const updateStoreItem = async (id, updates) => {
  const item = await StoreItem.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!item) throw ApiError.notFound("Store item not found");
  return item;
};

export const deleteStoreItem = async (id) => {
  const item = await StoreItem.findByIdAndDelete(id);
  if (!item) throw ApiError.notFound("Store item not found");
};
