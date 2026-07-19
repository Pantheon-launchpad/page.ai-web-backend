import mongoose from "mongoose";

// Catalog collection (not per-user) — pairs with UserMissionProgress.
const missionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "target" },
    reward: { type: Number, required: true },
    goal: { type: Number, required: true },
    metric: {
      type: String,
      enum: ["attempts", "study_minutes", "flashcards_reviewed", "logins", "cbt_submissions"],
      default: "attempts",
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Mission", missionSchema);
