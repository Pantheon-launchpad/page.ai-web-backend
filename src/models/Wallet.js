import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    todayCoins: { type: Number, default: 0 },
    lifetimeCoins: { type: Number, default: 0 },
    pendingSync: { type: Number, default: 0 },
    storeCredit: { type: Number, default: 0 },
    lastCoinDay: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  },
  { timestamps: true },
);

export default mongoose.model("Wallet", walletSchema);
