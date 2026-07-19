import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    chosenOptionId: { type: mongoose.Schema.Types.ObjectId, default: null },
    isCorrect: { type: Boolean, required: true },
    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

attemptSchema.index({ userId: 1, attemptedAt: -1 });
attemptSchema.index({ userId: 1, topicId: 1 });

export default mongoose.model("Attempt", attemptSchema);
