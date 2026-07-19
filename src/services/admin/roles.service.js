import RolePermission from "../../models/RolePermission.js";
import { ApiError } from "../../utils/ApiError.js";
import { ALL_ROLES } from "../../constants/roles.js";

export const listRoles = async () => RolePermission.find().sort({ role: 1 });

export const updateRolePermissions = async (role, permissions) => {
  if (!ALL_ROLES.includes(role)) throw ApiError.badRequest(`Unknown role "${role}"`);
  return RolePermission.findOneAndUpdate(
    { role },
    { $set: { permissions } },
    { new: true, upsert: true, runValidators: true },
  );
};
