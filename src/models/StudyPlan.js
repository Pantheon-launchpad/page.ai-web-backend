import mongoose from "mongoose";

const studyPlanEntrySchema = new mongoose.Schema(
  {
    day: { type: String, required: true }, // "Mon".."Sun"
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    topic: { type: String, default: "" },
    minutes: { type: Number, default: 30 },
    done: { type: Boolean, default: false },
  },
  { _id: true },
);

const studyPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    weekOf: { type: String, required: true }, // ISO date of week start
    dailyGoalMinutes: { type: Number, default: 60 },
    entries: { type: [studyPlanEntrySchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("StudyPlan", studyPlanSchema);
