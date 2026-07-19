import mongoose from "mongoose";

const masterySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
    masteryScore: { type: Number, min: 0, max: 1, default: 0.5 },
    consecutiveCorrect: { type: Number, default: 0 },
    consecutiveWrong: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

masterySchema.index({ userId: 1, topicId: 1 }, { unique: true });

export default mongoose.model("Mastery", masterySchema);
