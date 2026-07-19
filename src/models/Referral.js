import mongoose from "mongoose";
import { nanoid } from "../utils/nanoid.js";

const referralSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    code: { type: String, required: true, unique: true, default: () => nanoid(8).toUpperCase() },
    link: { type: String, default: "" },
    totalReferrals: { type: Number, default: 0 },
    activeReferrals: { type: Number, default: 0 },
    coinsEarned: { type: Number, default: 0 },
    monthlyGoal: { type: Number, default: 5 },
    monthlyProgress: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("Referral", referralSchema);
