import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "practice_attempt",
        "cbt_submit",
        "flashcard_review",
        "chat_message",
        "resource_view",
        "login",
        "mission_claim",
        "store_redeem",
      ],
      required: true,
    },
    label: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

activityLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);
