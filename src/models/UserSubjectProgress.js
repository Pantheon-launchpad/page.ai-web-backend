import mongoose from "mongoose";

const userSubjectProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    masteryScore: { type: Number, min: 0, max: 1, default: 0 },
    questionsAttempted: { type: Number, default: 0 },
    questionsCorrect: { type: Number, default: 0 },
    lastStudiedAt: { type: Date },
  },
  { timestamps: true },
);

userSubjectProgressSchema.index({ userId: 1, subjectId: 1 }, { unique: true });

export default mongoose.model("UserSubjectProgress", userSubjectProgressSchema);
