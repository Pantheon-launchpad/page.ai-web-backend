import mongoose from "mongoose";

const storeItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "gift" },
    cost: { type: Number, required: true },
    // Product constraint (API_CONTRACT.md §17): redemptions are in-app value only.
    kind: {
      type: String,
      enum: ["premium_time", "bonus_content", "cosmetic"],
      required: true,
    },
    comingSoon: { type: Boolean, default: false },
    // null = platform-wide store item; set = a school-branded reward
    // exclusive to that school's students (e.g. "Founder's Day badge").
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", default: null, index: true },
  },
  { timestamps: true },
);

export default mongoose.model("StoreItem", storeItemSchema);
