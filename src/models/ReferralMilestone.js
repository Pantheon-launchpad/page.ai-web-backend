import mongoose from "mongoose";

const referralMilestoneSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    threshold: { type: Number, required: true },
    label: { type: String, required: true },
    reward: { type: Number, required: true },
    achieved: { type: Boolean, default: false },
    achievedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("ReferralMilestone", referralMilestoneSchema);
