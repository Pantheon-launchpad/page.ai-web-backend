import User from "../../models/User.js";
import { ApiError } from "../../utils/ApiError.js";
import { toUserDto } from "../../dto/userDto.js";

export const listUsers = async ({ search, page = 1, pageSize = 20, schoolScope }) => {
  const filter = {};
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (schoolScope) filter.schoolId = schoolScope;

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    User.countDocuments(filter),
  ]);
  return { items: items.map(toUserDto), page: Number(page), pageSize: Number(pageSize), total };
};

export const getUser = async (id, schoolScope) => {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound("User not found");
  if (schoolScope && (!user.schoolId || user.schoolId.toString() !== schoolScope)) {
    throw ApiError.forbidden("This user is not in your school");
  }
  return toUserDto(user);
};

export const updateUser = async (id, updates) => {
  const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound("User not found");
  return toUserDto(user);
};

export const setUserStatus = async (id, status) => {
  const user = await User.findByIdAndUpdate(id, { status }, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  return toUserDto(user);
};

export const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw ApiError.notFound("User not found");
};
