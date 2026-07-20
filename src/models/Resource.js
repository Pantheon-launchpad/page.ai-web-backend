import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["video", "pdf", "article", "audio", "past_question"], required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", index: true },
    url: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    durationMinutes: { type: Number, default: 0 },
    description: { type: String, default: "" },
    status: { type: String, enum: ["published", "draft", "flagged", "removed"], default: "published" },
    // null = platform-wide (visible to every user); set = exclusive to that
    // school's own users. See utils/tenantFilter.js.
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", default: null, index: true },
  },
  { timestamps: true },
);

resourceSchema.index({ title: "text", description: "text" });

export default mongoose.model("Resource", resourceSchema);
