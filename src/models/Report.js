import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reason: { type: String, required: true },
    status: { type: String, enum: ["open", "reviewing", "resolved", "dismissed"], default: "open" },
    targetType: { type: String, enum: ["user", "question", "resource", "chat_message"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Report", reportSchema);
