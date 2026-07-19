import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, required: true },
    type: { type: String, enum: ["earned", "spent"], required: true },
    category: { type: String, default: "general" },
    coins: { type: Number, required: true },
    status: { type: String, enum: ["approved", "pending", "rejected"], default: "approved" },
  },
  { timestamps: true },
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("WalletTransaction", walletTransactionSchema);
