import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    target: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String, default: "" },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
