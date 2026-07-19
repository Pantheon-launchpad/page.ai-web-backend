import mongoose from "mongoose";

const downloadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource" },
    title: { type: String, required: true },
    sizeMb: { type: Number, default: 0 },
    kind: { type: String, enum: ["video", "pdf", "audio", "questions"], default: "pdf" },
  },
  { timestamps: true },
);

export default mongoose.model("Download", downloadSchema);
