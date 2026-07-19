import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    icon: { type: String, default: "book" },
    color: { type: String, default: "#6366F1" },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Subject", subjectSchema);
