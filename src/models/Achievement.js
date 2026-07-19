import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "trophy" },
    goal: { type: Number, default: 1 },
    metric: {
      type: String,
      enum: ["attempts", "streak_days", "cbt_submissions", "flashcards_reviewed", "referrals"],
      default: "attempts",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Achievement", achievementSchema);
