import mongoose from "mongoose";

/**
 * Records every offline action submitted via POST /sync/actions, keyed by a
 * CLIENT-generated clientActionId. This is what makes replaying a batch of
 * actions after reconnecting safe: if the same action is sent twice (e.g.
 * the client retried after a flaky connection didn't confirm the response),
 * the second submission is recognized as a duplicate and not double-applied.
 */
const pendingActionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    deviceId: { type: String, required: true },
    clientActionId: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "practice_attempt",
        "cbt_submit",
        "flashcard_review",
        "mission_claim",
        "settings_update",
        "study_plan_update",
      ],
      required: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    occurredAt: { type: Date, required: true }, // client-side timestamp of when the action actually happened, offline
    status: {
      type: String,
      enum: ["applied", "duplicate", "conflict", "failed"],
      required: true,
    },
    result: { type: mongoose.Schema.Types.Mixed },
    error: { type: String },
  },
  { timestamps: true },
);

pendingActionSchema.index({ userId: 1, clientActionId: 1 }, { unique: true });

export default mongoose.model("PendingAction", pendingActionSchema);
