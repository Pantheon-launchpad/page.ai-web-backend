import mongoose from "mongoose";

// Payment processor integration is explicitly TBD per API_CONTRACT.md §19 —
// this model tracks plan state so /premium/plans and /premium/upgrade have
// somewhere real to read/write, without assuming a specific payment provider.
const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    plan: { type: String, enum: ["free", "premium"], default: "free" },
    status: { type: String, enum: ["active", "canceled", "pending"], default: "active" },
    startedAt: { type: Date },
    renewsAt: { type: Date },
    paymentRef: { type: String, default: "" }, // opaque reference for whichever processor is wired up later
  },
  { timestamps: true },
);

export default mongoose.model("Subscription", subscriptionSchema);
