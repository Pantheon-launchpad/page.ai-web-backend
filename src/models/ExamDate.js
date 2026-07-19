import mongoose from "mongoose";

const examDateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    examName: { type: String, required: true }, // e.g. "WAEC 2026"
    date: { type: Date, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("ExamDate", examDateSchema);
