import mongoose from "mongoose";

const userAchievementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    achievementId: { type: mongoose.Schema.Types.ObjectId, ref: "Achievement", required: true },
    progress: { type: Number, default: 0 },
    earned: { type: Boolean, default: false },
    earnedAt: { type: Date },
  },
  { timestamps: true },
);

userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export default mongoose.model("UserAchievement", userAchievementSchema);
