import mongoose from "mongoose";

const examAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    examConfigId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamConfig", required: true },
    answers: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    timeTakenSeconds: { type: Number, default: 0 },
    coinsEarned: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

examAttemptSchema.index({ userId: 1, examConfigId: 1, submittedAt: -1 });

export default mongoose.model("ExamAttempt", examAttemptSchema);
