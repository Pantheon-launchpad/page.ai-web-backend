import mongoose from "mongoose";

const mistakeSchema = new mongoose.Schema(
  {
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: "Attempt", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    misconceptionSummary: { type: String, default: "" },
    mnemonic: { type: String, default: "" },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

mistakeSchema.index({ userId: 1, subjectId: 1 });

export default mongoose.model("Mistake", mistakeSchema);
