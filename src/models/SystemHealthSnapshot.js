import mongoose from "mongoose";

const serviceStatusSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ["operational", "degraded", "down"], default: "operational" },
    latencyMs: { type: Number, default: 0 },
    uptimePercent: { type: Number, default: 100 },
  },
  { _id: false },
);

const systemHealthSnapshotSchema = new mongoose.Schema(
  {
    services: { type: [serviceStatusSchema], default: [] },
    takenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("SystemHealthSnapshot", systemHealthSnapshotSchema);
