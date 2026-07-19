import mongoose from "mongoose";

const examConfigSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    subjects: { type: [String], default: [] }, // for multi-subject mock exams
    board: { type: String, enum: ["WAEC", "JAMB", "Mock"], required: true },
    kind: { type: String, enum: ["paper", "mock_exam"], default: "paper" },
    durationMinutes: { type: Number, required: true },
    questionCount: { type: Number, required: true },
    hasCalculator: { type: Boolean, default: false },
    coinsReward: { type: Number, default: 50 },
  },
  { timestamps: true },
);

export default mongoose.model("ExamConfig", examConfigSchema);
