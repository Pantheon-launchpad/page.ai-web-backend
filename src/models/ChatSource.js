import mongoose from "mongoose";

const chatSourceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: "UploadedFile" },
    kind: { type: String, enum: ["textbook", "chapter", "uploaded_doc"], default: "uploaded_doc" },
    status: { type: String, enum: ["processing", "ready", "failed"], default: "ready" },
  },
  { timestamps: true },
);

export default mongoose.model("ChatSource", chatSourceSchema);
