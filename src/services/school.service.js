import School from "../models/School.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../constants/roles.js";

/** Used by signup (schoolCode) to attach a new student to a tenant. */
export const resolveSchoolByCode = async (code) => {
  if (!code) return null;
  const school = await School.findOne({ code: code.toUpperCase(), active: true });
  return school; // silently ignored by the caller if not found — a bad code shouldn't fail signup
};

export const listSchools = async ({ page = 1, pageSize = 20 } = {}) => {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    School.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    School.countDocuments(),
  ]);
  return { items, page: Number(page), pageSize: Number(pageSize), total };
};

export const createSchool = async ({ name, address, contactEmail, ownerUserId }) => {
  const school = await School.create({ name, address, contactEmail, ownerId: ownerUserId });

  if (ownerUserId) {
    // The creating user becomes that school's scoped admin — this is how a
    // school_admin ends up with a schoolId at all (there's no separate
    // "invite an admin" flow in this pass; see AUDIT-style note in README).
    await User.findByIdAndUpdate(ownerUserId, { schoolId: school._id, role: ROLES.SCHOOL_ADMIN });
  }

  return school;
};

export const updateSchool = async (id, updates) => {
  const school = await School.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!school) throw ApiError.notFound("School not found");
  return school;
};

export const getSchool = async (id) => {
  const school = await School.findById(id);
  if (!school) throw ApiError.notFound("School not found");
  return school;
};

export const listSchoolStudents = async (schoolId, { page = 1, pageSize = 20 } = {}) => {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    User.find({ schoolId }).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    User.countDocuments({ schoolId }),
  ]);
  return { items, page: Number(page), pageSize: Number(pageSize), total };
};
