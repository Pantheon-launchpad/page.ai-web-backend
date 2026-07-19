import mongoose from "mongoose";

const userSettingsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    notifications: {
      dailyReminder: { type: Boolean, default: true },
      streakAlerts: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
      achievementAlerts: { type: Boolean, default: true },
    },
    study: {
      dailyGoalMinutes: { type: Number, default: 60 },
      difficultyPreference: { type: String, enum: ["easy", "adaptive", "hard"], default: "adaptive" },
    },
    theme: { type: String, enum: ["light", "dark", "soft", "system"], default: "system" },
  },
  { timestamps: true },
);

export default mongoose.model("UserSettings", userSettingsSchema);
