import mongoose from "mongoose";

// NOTE (architectural decision): the contract's appendix lists `options` as
// its own collection, but options are 1:1-with-their-question, always read
// together, and never queried independently — so they're embedded as
// subdocuments here rather than a separate top-level collection. Each
// subdocument keeps its own _id, so `optionId` references used elsewhere in
// the contract (e.g. attempts.chosenOptionId) still resolve to a stable id.
const optionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // "A" | "B" | "C" | "D"
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true },
);

const questionSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    stem: { type: String, required: true },
    difficulty: { type: Number, min: 1, max: 5, default: 3 },
    options: { type: [optionSchema], validate: (v) => v.length >= 2 },
    explanation: { type: String, default: "" },
    examConfigId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamConfig", default: null },
  },
  { timestamps: true },
);

questionSchema.index({ subjectId: 1, difficulty: 1 });
questionSchema.index({ examConfigId: 1 });

export default mongoose.model("Question", questionSchema);
