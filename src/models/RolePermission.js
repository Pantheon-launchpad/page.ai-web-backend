import mongoose from "mongoose";

// Mirrors constants/roles.js's ROLE_PERMISSIONS so the admin UI's role table
// (GET /admin/roles) has a queryable, editable source of truth instead of a
// hardcoded constant. Seeded from ROLE_PERMISSIONS on first boot (see seed script).
const rolePermissionSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, unique: true },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("RolePermission", rolePermissionSchema);
