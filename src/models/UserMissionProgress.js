import mongoose from "mongoose";

const userMissionProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    missionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", required: true },
    day: { type: String, required: true }, // YYYY-MM-DD, missions reset daily
    progress: { type: Number, default: 0 },
    claimed: { type: Boolean, default: false },
    claimedAt: { type: Date },
  },
  { timestamps: true },
);

userMissionProgressSchema.index({ userId: 1, missionId: 1, day: 1 }, { unique: true });

export default mongoose.model("UserMissionProgress", userMissionProgressSchema);
