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
  },
  { timestamps: true },
);

export default mongoose.model("StoreItem", storeItemSchema);
