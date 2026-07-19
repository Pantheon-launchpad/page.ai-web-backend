import mongoose from "mongoose";

const streakSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDay: { type: String, default: null }, // YYYY-MM-DD
    history: { type: [String], default: [] }, // array of YYYY-MM-DD days with activity
  },
  { timestamps: true },
);

export default mongoose.model("Streak", streakSchema);
